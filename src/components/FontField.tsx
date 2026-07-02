import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { BASE_FONTS } from '../data/fonts';
import { FONT_META } from '../data/font-meta';
import { useViewport } from '../hooks/useViewport';
import { LAYOUT } from '../data/layout';
import type { Slot } from '../types';

interface Props {
  fontA: string | null;
  fontB: string | null;
  lastSlot: Slot;
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

// Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
function quadBezier(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function FontField({ fontA, fontB, lastSlot, hoveredId, onSelect, onHover }: Props) {
  const { w, h } = useViewport();
  const nodeRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const homesRef   = useRef(homePositions(w, h));
  const tweenRefs  = useRef<(gsap.core.Tween | null)[]>([]);
  const rotTweens  = useRef<(gsap.core.Tween | null)[]>([]);
  // quickTo setters for letter-spacing repulsion (Craft Decision #3)
  const lsSetters  = useRef<((v: number) => void)[]>([]);
  // Restartable drift loops — flight/impulse kill wander tweens, these bring them back
  const wanderFns  = useRef<(() => void)[]>([]);
  const rotFns     = useRef<(() => void)[]>([]);
  // Indices currently mid-flight (ignored by drift, repulsion, impulse)
  const flyingRef  = useRef<Set<number>>(new Set());
  // Font ids that flew to an anchor — need a home reset when un-anchored
  const flownRef   = useRef<Set<string>>(new Set());

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
      const vwGuess = meta?.visualWeight ?? 5;
      // visualWeight 0-10 → map to 300-900 range for mapRange
      const dur = weightToDuration(vwGuess * 100);

      // Position at home (unless this node is anchored / mid-flight)
      const id = BASE_FONTS[i].id;
      const anchored = fontA === id || fontB === id;
      if (!flyingRef.current.has(i) && !anchored) {
        gsap.set(el, { x: home.x, y: home.y });
      }

      // Wander loop — recursive, guarded against flight
      function wander() {
        if (flyingRef.current.has(i)) return;
        const home2 = homesRef.current[i];
        const dx = clampedOffset(home2.x, 40, w);
        const dy = clampedOffset(home2.y, 40, h);
        tweenRefs.current[i] = gsap.to(el!, {
          x: home2.x + dx,
          y: home2.y + dy,
          duration: dur,
          ease: 'sine.inOut',
          overwrite: 'auto',
          onComplete: wander,
        });
      }
      wanderFns.current[i] = wander;

      // Rotation wander ±1.5°, independent slower loop
      function startRot() {
        rotTweens.current[i]?.kill();
        rotTweens.current[i] = gsap.to(el!, {
          rotation: (Math.random() - 0.5) * 3,
          duration: gsap.utils.random(9, 16),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          overwrite: 'auto',
        });
      }
      rotFns.current[i] = startRot;

      if (!flyingRef.current.has(i) && !anchored) {
        // Stagger start
        gsap.delayedCall(Math.random() * 4, wander);
        startRot();
      }

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

  // ── Opacity choreography + un-anchor restore (GSAP-driven, no CSS transition
  //    on the wrapper — flight dims imperatively before React state changes) ──
  useEffect(() => {
    const anySelected = fontA !== null || fontB !== null;
    const bothAnchored = !!(fontA && fontB);
    const dimTarget = bothAnchored ? 0.25 : 0.4;

    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const id = BASE_FONTS[i].id;
      const anchored = fontA === id || fontB === id;
      if (flyingRef.current.has(i)) return; // flight owns this node right now

      if (anchored) {
        gsap.set(el, { opacity: 0 });
        return;
      }

      // Was anchored, now released — snap home and resume drift
      if (flownRef.current.has(id)) {
        flownRef.current.delete(id);
        const home = homesRef.current[i];
        gsap.set(el, { x: home.x, y: home.y, scale: 1, rotation: 0 });
        wanderFns.current[i]?.();
        rotFns.current[i]?.();
      }

      gsap.to(el, {
        opacity: anySelected ? dimTarget : 1,
        duration: 0.5,
        ease: 'power2.inOut',
        overwrite: 'auto',
      });
    });
  }, [fontA, fontB]);

  // ── Which anchor slot the next click fills ──
  const targetSlot: Slot = !fontA ? 'A' : !fontB ? 'B' : (lastSlot === 'A' ? 'B' : 'A');

  // ── Arc flight ──
  const flyToAnchor = useCallback((i: number, id: string) => {
    const el = nodeRefs.current[i];
    if (!el || flyingRef.current.has(i)) return;

    if (prefersReducedMotion()) {
      // Skip the arc: mark as flown, hide in field, let the anchor fade in.
      flownRef.current.add(id);
      gsap.to(el, { opacity: 0, duration: 0.2, ease: 'power2.inOut', overwrite: 'auto' });
      onSelect(id);
      return;
    }

    flyingRef.current.add(i);
    flownRef.current.add(id);
    onHover(null);

    // Stop drift so the flight fully owns x/y/rotation
    tweenRefs.current[i]?.kill();
    rotTweens.current[i]?.kill();
    gsap.killTweensOf(el);
    el.style.pointerEvents = 'none';
    el.style.zIndex = '30';

    // P0: current position, P2: anchor slot target
    const p0x = gsap.getProperty(el, 'x') as number;
    const p0y = gsap.getProperty(el, 'y') as number;
    const p2x = targetSlot === 'A' ? w * 0.11 : w * 0.89;
    const p2y = h * 0.38;

    const dx = p2x - p0x;
    const dy = p2y - p0y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // P1: midpoint offset perpendicular by 0.12 × distance, biased upward
    let perpX = -dy / dist;
    let perpY = dx / dist;
    if (perpY > 0) { perpX = -perpX; perpY = -perpY; } // upward bias (negative y)
    const lift = 0.12 * dist;
    const p1x = (p0x + p2x) / 2 + perpX * lift;
    const p1y = (p0y + p2y) / 2 + perpY * lift;

    const duration = gsap.utils.clamp(0.85, 1.1, 0.85 + (dist / w) * 0.25);

    // Scale up continuously during flight (field ~15px → anchor ~26px)
    gsap.fromTo(el,
      { scale: 1 },
      { scale: 1.8, duration, ease: 'power3.inOut', overwrite: 'auto' }
    );
    // Straighten out any drift rotation mid-flight
    gsap.to(el, { rotation: 0, duration: duration * 0.6, ease: 'power2.out', overwrite: 'auto' });

    // Manual quadratic bezier — animate t, set x/y each frame
    const proxy = { t: 0 };
    gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate: () => {
        gsap.set(el, {
          x: quadBezier(p0x, p1x, p2x, proxy.t),
          y: quadBezier(p0y, p1y, p2y, proxy.t),
        });
      },
      onComplete: () => {
        // Land: overshoot settle, then hand off to the anchor
        gsap.to(el, {
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.3)',
          overwrite: 'auto',
          onComplete: () => {
            gsap.set(el, { opacity: 0 });
            el.style.pointerEvents = '';
            el.style.zIndex = '';
            flyingRef.current.delete(i);
            onSelect(id);
          },
        });
      },
    });

    // ── Field reaction: radial impulse on neighbors within 200px ──
    const willBothBeFilled = fontA !== null || fontB !== null;
    const dimTarget = willBothBeFilled ? 0.25 : 0.4;

    nodeRefs.current.forEach((other, j) => {
      if (!other || j === i || flyingRef.current.has(j)) return;
      const otherId = BASE_FONTS[j].id;
      if (fontA === otherId || fontB === otherId) return; // anchored — leave alone

      // Dim all other field names simultaneously
      gsap.to(other, { opacity: dimTarget, duration: 0.5, ease: 'power2.inOut', overwrite: 'auto' });

      const ox = gsap.getProperty(other, 'x') as number;
      const oy = gsap.getProperty(other, 'y') as number;
      const ddx = ox - p0x;
      const ddy = oy - p0y;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d >= 200 || d === 0) return;

      // Falloff: 30px push at 0 distance → 10px at 200px
      const push = 30 - (d / 200) * 20;
      const pushX = (ddx / d) * push;
      const pushY = (ddy / d) * push;
      const home = homesRef.current[j];

      // Impulse kills the wander tween (overwrite auto) — restart drift after return
      gsap.to(other, {
        x: `+=${pushX}`,
        y: `+=${pushY}`,
        duration: 0.3,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(other, {
        x: home.x,
        y: home.y,
        duration: 1.2,
        ease: 'power2.inOut',
        delay: 0.3,
        overwrite: 'auto',
        onComplete: () => { wanderFns.current[j]?.(); },
      });
    });
  }, [w, h, fontA, fontB, targetSlot, onSelect, onHover]);

  // ── Cursor repulsion — letter-spacing, not scale (Craft Decision #3) ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const RADIUS = 120;
    const MAX_LS = 24; // max letter-spacing in px equivalent
    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      if (flyingRef.current.has(i)) return; // flight owns position
      const id = BASE_FONTS[i].id;
      if (fontA === id || fontB === id) return; // anchored — hidden
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
  }, [fontA, fontB]);

  const handleMouseLeave = useCallback(() => {
    lsSetters.current.forEach(setter => setter?.(0));
  }, []);

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

        return (
          <div
            key={font.id}
            ref={el => { nodeRefs.current[i] = el; }}
            onClick={() => !isAnchored && flyToAnchor(i, font.id)}
            onMouseEnter={() => !isAnchored && onHover(font.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              position: 'absolute', top: 0, left: 0,
              cursor: isAnchored ? 'default' : 'pointer',
              userSelect: 'none',
              // opacity is GSAP-driven (dim choreography + flight handoff)
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
