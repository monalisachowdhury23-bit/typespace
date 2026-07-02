import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { BASE_FONTS } from '../data/fonts';
import { FONT_META } from '../data/font-meta';
import { useViewport } from '../hooks/useViewport';
import { LAYOUT } from '../data/layout';

interface Props {
  fontA: string | null;
  fontB: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

// Visual-weight → drift duration (mass-weighted, per motion spec)
// heavier = slower: weight 9 → ~13s, weight 3 → ~7s
const weightToDuration = gsap.utils.mapRange(300, 900, 14, 7);

// ── Home positions from layout.ts (% → px once viewport is known) ──
function homePositions(vw: number, vh: number) {
  return BASE_FONTS.map(f => {
    const pos = LAYOUT[f.id] ?? { x: 50, y: 50 };
    return {
      x: (pos.x / 100) * vw,
      y: (pos.y / 100) * vh,
    };
  });
}

// Edge-aware tether: clamp wander radius on sides near viewport edge
function clampedOffset(
  home: number, max: number, range: number, edgeMargin = 0.12
): number {
  const edgePx = range * edgeMargin;
  const nearLeft  = home < edgePx;
  const nearRight = home > range - edgePx;
  const cap = nearLeft || nearRight ? 14 : max;
  return (Math.random() - 0.5) * 2 * cap;
}

export function FontField({ fontA, fontB, hoveredId, onSelect, onHover }: Props) {
  const { w, h } = useViewport();
  const nodeRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const homesRef   = useRef(homePositions(w, h));
  const tweenRefs  = useRef<(gsap.core.Tween | null)[]>([]);
  const rotTweens  = useRef<(gsap.core.Tween | null)[]>([]);
  // quickTo setters for letter-spacing repulsion (Craft Decision #3)
  const lsSetters  = useRef<((v: number) => void)[]>([]);

  // ── Recalc homes on viewport resize ──
  useEffect(() => {
    homesRef.current = homePositions(w, h);
  }, [w, h]);

  // ── Ambient drift (mass-weighted, tethered ±40px) ──
  useEffect(() => {
    tweenRefs.current.forEach(t => t?.kill());
    rotTweens.current.forEach(t => t?.kill());

    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const home = homesRef.current[i];
      const meta = FONT_META[BASE_FONTS[i].id];
      const vw   = meta?.visualWeight ?? 5;
      // visualWeight 0-10 → map to 300-900 range for mapRange
      const dur = weightToDuration(vw * 100);

      // Position at home
      gsap.set(el, { x: home.x, y: home.y });

      // Wander loop — recursive
      function wander() {
        const dx = clampedOffset(home.x, 40, w);
        const dy = clampedOffset(home.y, 40, h);
        tweenRefs.current[i] = gsap.to(el!, {
          x: home.x + dx,
          y: home.y + dy,
          duration: dur,
          ease: 'sine.inOut',
          overwrite: 'auto',
          onComplete: wander,
        });
      }

      // Stagger start
      gsap.delayedCall(Math.random() * 4, wander);

      // Rotation wander ±1.5°, independent slower loop
      rotTweens.current[i] = gsap.to(el, {
        rotation: (Math.random() - 0.5) * 3,
        duration: gsap.utils.random(9, 16),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // quickTo setter for letter-spacing repulsion
      const nameEl = el.querySelector('[data-name]') as HTMLElement | null;
      if (nameEl) {
        lsSetters.current[i] = gsap.quickTo(nameEl, 'letterSpacing', {
          duration: 0.4,
          ease: 'power2.out',
        }) as unknown as (v: number) => void;
      }
    });

    return () => {
      tweenRefs.current.forEach(t => t?.kill());
      rotTweens.current.forEach(t => t?.kill());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);

  // ── Cursor repulsion — letter-spacing, not scale (Craft Decision #3) ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const RADIUS = 120;
    const MAX_LS = 24; // max letter-spacing in px equivalent
    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < RADIUS) {
        const t = 1 - dist / RADIUS;
        const ls = t * MAX_LS * 0.001; // convert to em-ish
        lsSetters.current[i]?.(ls);

        // Radial push on the element position too (subtle)
        const pushDist = t * 24;
        const angle = Math.atan2(dy, dx);
        gsap.to(el, {
          x: `+=${-Math.cos(angle) * pushDist * 0.15}`,
          y: `+=${-Math.sin(angle) * pushDist * 0.15}`,
          duration: 0.4, ease: 'power2.out', overwrite: 'auto',
        });
      } else {
        // Release: ease back to 0 tracking
        lsSetters.current[i]?.(0);
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    lsSetters.current.forEach(setter => setter?.(0));
  }, []);

  // ── Dim all non-anchored on selection ──
  const bothAnchored = fontA && fontB;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {BASE_FONTS.map((font, i) => {
        const isAnchoredA = fontA === font.id;
        const isAnchoredB = fontB === font.id;
        const isAnchored  = isAnchoredA || isAnchoredB;
        const dimmed      = !isAnchored && (fontA !== null || fontB !== null);

        return (
          <div
            key={font.id}
            ref={el => { nodeRefs.current[i] = el; }}
            onClick={() => !isAnchored && onSelect(font.id)}
            onMouseEnter={() => !isAnchored && onHover(font.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              position: 'absolute', top: 0, left: 0,
              cursor: isAnchored ? 'default' : 'pointer',
              userSelect: 'none',
              opacity: isAnchored ? 0 : dimmed ? (bothAnchored ? 0.25 : 0.4) : 1,
              transition: 'opacity 0.5s ease',
              pointerEvents: isAnchored ? 'none' : 'auto',
            }}
          >
            <div
              data-name
              style={{
                fontFamily: `'${font.name}', serif`,
                fontSize: 15,
                color: '#f0ede8',
                lineHeight: 1,
                letterSpacing: 0,
                opacity: hoveredId === font.id ? 1 : 0.72,
                transition: 'opacity 0.2s ease',
              }}
            >
              {font.name}
            </div>

            {/* Specimen line — only on hover */}
            {hoveredId === font.id && (
              <div style={{
                fontFamily: `'${font.name}', serif`,
                fontSize: 9, color: '#5a5450',
                marginTop: 5, letterSpacing: '0.03em',
                pointerEvents: 'none',
              }}>
                {font.specimen}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
