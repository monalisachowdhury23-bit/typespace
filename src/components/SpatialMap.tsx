import {
  useRef, useCallback, useEffect, useMemo, useState, memo,
} from 'react';
import gsap from 'gsap';
import { FONT_UNIVERSE } from '../data/universe';
import type { UniverseFont } from '../data/universe';
import { computePositions, orbitPositions, peripheryPos } from '../data/computed-layout';
import type { NodePos } from '../data/computed-layout';
import {
  getCompatMap, relType, REL_COLORS, annotationCopy, bothDevanagari,
  bezierPath, bezierMidpoint,
} from '../data/compat';
import { useViewport } from '../hooks/useViewport';
import type { AppState } from '../hooks/useAppState';
import { prefersReducedMotion } from '../motion';

// ── Constants ────────────────────────────────────────────────────────────────
// Star magnitudes — Aa at three sizes creates foreground / midground / background depth
const GLYPH_SIZE: Record<1 | 2 | 3, number> = { 1: 24, 2: 16, 3: 11 };
// Every tier stays above 4.5:1 against the background (tier 3 = 5.3:1).
const TIER_OPACITY: Record<1 | 2 | 3, number> = { 1: 1.0, 2: 0.75, 3: 0.55 };
const DIM_FLOOR = 0.55;          // hover-dimming never drops a font below 4.5:1
const PERIPHERY_OPACITY = 0.22;  // faded fonts while anchored: inactive, not clickable
const NAME_IDLE = 0.6;           // tier-1 names at rest (6.2:1)
// On narrow screens names only appear on tap, otherwise they pile into each other
const nameIdle = (tier: 1 | 2 | 3) =>
  tier === 1 && typeof window !== 'undefined' && window.innerWidth >= 700 ? NAME_IDLE : 0;
const LINE_STANDOFF = 8; // px
const DASH = '6 5';       // dashed line = both fonts carry Devanagari
const INNER_COUNT = 5;
const ORBIT_COUNT = 12;

interface ConnectionLine {
  key: string;
  path: string;
  color: string;
  dashLen: number;
  label: string;     // kept for tooltip — not rendered on the line
  midX: number;
  midY: number;
  delay: number;
  partnerId: string; // so tooltip can look up visual position
  dashed: boolean;   // both fonts carry Devanagari
}

interface TooltipState {
  partnerId: string;
  label: string;
  color: string;
  x: number; // visual centre of partner node
  y: number;
}

interface Props {
  state: AppState;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onBack: () => void;
}

// ── Compat map (module-level singleton) ──────────────────────────────────────
const COMPAT_MAP = getCompatMap(FONT_UNIVERSE);
const FONT_MAP = new Map(FONT_UNIVERSE.map(f => [f.id, f]));

function idHash(id: string) {
  const h1 = (id.charCodeAt(0) * 7 + id.charCodeAt(1) * 3) % 100 / 100;
  const h2 = (id.charCodeAt(2) * 11 + id.length * 5) % 100 / 100;
  return { h1, h2 };
}

// ── FontNameplate ─────────────────────────────────────────────────────────────
interface NameplateProps {
  font: UniverseFont;
  x: number;
  y: number;
  nodeRef: (el: HTMLDivElement | null) => void;
  onActivate: (id: string) => void;
  onEnter: (id: string) => void;
  onLeave: (id: string) => void;
}

const FontNameplate = memo(function FontNameplate({
  font, x, y, nodeRef, onActivate, onEnter, onLeave,
}: NameplateProps) {
  const glyphSize = GLYPH_SIZE[font.tier];
  const hit = Math.max(32, glyphSize * 2); // generous tap target around small glyphs

  return (
    <div
      ref={nodeRef}
      className="fn-node"
      role="button"
      aria-label={`${font.name}, ${font.category}`}
      tabIndex={0}
      data-id={font.id}
      // left/top = semantic center; GSAP owns x/y/scale/opacity transforms.
      style={{
        left: x,
        top: y,
        opacity: 0,
        willChange: 'transform, opacity',
      }}
      onClick={() => onActivate(font.id)}
      onPointerEnter={() => onEnter(font.id)}
      onPointerLeave={() => onLeave(font.id)}
      onFocus={() => onEnter(font.id)}
      onBlur={() => onLeave(font.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(font.id); }
      }}
    >
      {/* Push layer — hover lift and "make room" live here, so they never
          fight the drift and flight tweens on the outer node. */}
      <div className="fn-push">
        {/* Inner centering wrapper — CSS only, never touched by GSAP */}
        <div style={{
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          display: 'inline-block',
          position: 'relative',
        }}>
          {/* Invisible hit area so small glyphs are still easy to tap */}
          <span aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: hit, height: hit, transform: 'translate(-50%, -50%)',
          }} />

          {/* Hover ring */}
          <div
            className="fn-ring"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: glyphSize * 3.2,
              height: glyphSize * 3.2,
              borderRadius: '50%',
              border: '1px solid var(--ink)',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />

          {/* Primary node — 'Aa' in each font's own typeface. */}
          <div
            className="fn-glyph"
            aria-hidden="true"
            style={{
              fontFamily: `'${font.name}', serif, sans-serif`,
              fontSize: glyphSize,
              color: 'var(--ink)',
              lineHeight: 1,
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {font.signatureGlyph}
          </div>

          {/* Name label — hangs below the glyph without affecting its centre,
              so lines and the anchor position line up with the glyph itself */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '100%', left: '50%', width: 0,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div
              className="fn-name"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                color: 'var(--ink)',
                opacity: nameIdle(font.tier),
                marginTop: 5,
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                flex: 'none',
              }}
            >
              {font.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Partner annotation tooltip ────────────────────────────────────────────────
// Kept fully on screen: measured after mount and nudged inside a 16px margin,
// flipped above the font when it would collide with the bottom bar.
function PartnerTooltip({ tt }: { tt: TooltipState }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = tt.x - r.width / 2;
    left = Math.max(16, Math.min(vw - 16 - r.width, left));
    let top = tt.y + 30;
    if (top + r.height > vh - 96) top = tt.y - 30 - r.height;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    gsap.fromTo(el,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
    );
  }, [tt]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: tt.x,
        top: tt.y + 30,
        pointerEvents: 'none',
        zIndex: 20,
        opacity: 0,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(6, 6, 6, 0.94)',
        border: `1px solid ${tt.color}55`,
        borderLeft: `2px solid ${tt.color}`,
        borderRadius: '0 4px 4px 0',
        padding: '7px 12px 7px 10px',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        lineHeight: 1.4,
        color: tt.color,
        letterSpacing: '0.04em',
      }}>
        {tt.label}
      </div>
    </div>
  );
}

// ── Main SpatialMap component ─────────────────────────────────────────────────
export function SpatialMap({ state, onSelect, onHover, onBack }: Props) {
  const { w, h } = useViewport();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const ambientTweens = useRef<Map<string, gsap.core.Tween>>(new Map());
  const ambientStarted = useRef(false);
  const prevAnchorId = useRef<string | null>(null);
  const prevSize = useRef({ w, h });
  const prevMode = useRef(state.mode);
  const lastPartnerId = useRef<string | null>(null);
  // Tracks where partners land during anchor state so connection lines draw accurately
  const orbitPosRef = useRef<Map<string, NodePos>>(new Map());
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(state.mode);
  const anchorRef = useRef(state.anchorId);
  const heartbeatTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [announce, setAnnounce] = useState('');

  // Keep refs current for timeout callbacks (avoids stale closures)
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => { anchorRef.current = state.anchorId; }, [state.anchorId]);
  useEffect(() => { if (state.partnerId) lastPartnerId.current = state.partnerId; }, [state.partnerId]);

  // ── Semantic positions (memoized on viewport size) ──────────────────────────
  const positions = useMemo(() => computePositions(FONT_UNIVERSE, w, h), [w, h]);

  // Render (and therefore tab) order follows the map: inner ring outward,
  // clockwise from twelve o'clock within each ring.
  const orderedFonts = useMemo(() => {
    const cx = w / 2, cy = h / 2;
    const band = Math.min(w * 0.46, h * 0.47) * 0.18;
    const key = (f: UniverseFont) => {
      const p = positions.get(f.id) ?? { x: cx, y: cy };
      const ring = Math.round(Math.hypot(p.x - cx, p.y - cy) / band);
      let ang = Math.atan2(p.x - cx, -(p.y - cy)); // 0 at top, clockwise
      if (ang < 0) ang += Math.PI * 2;
      return ring * 10 + ang;
    };
    return [...FONT_UNIVERSE].sort((a, b) => key(a) - key(b));
  }, [positions, w, h]);

  // ── Register node refs ──────────────────────────────────────────────────────
  const refCallbacks = useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const setNodeRef = useCallback((id: string) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (el) nodeRefs.current.set(id, el);
        else    nodeRefs.current.delete(id);
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    pendingTimers.current.push(t);
    return t;
  };

  // Cleanup on unmount
  useEffect(() => () => {
    heartbeatTimers.current.forEach(clearTimeout);
    pendingTimers.current.forEach(clearTimeout);
  }, []);

  // ── Field entrance animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (ambientStarted.current || nodeRefs.current.size < 10) return;
    ambientStarted.current = true;

    const allNodes: { el: HTMLDivElement; font: UniverseFont }[] = [];
    FONT_UNIVERSE.forEach(font => {
      const el = nodeRefs.current.get(font.id);
      if (el) allNodes.push({ el, font });
    });

    if (prefersReducedMotion()) {
      allNodes.forEach(({ el, font }) => gsap.set(el, { opacity: TIER_OPACITY[font.tier], scale: 1 }));
      return; // no drift, no pulses
    }

    const t1Nodes = allNodes.filter(n => n.font.tier === 1).map(n => n.el);
    const t23Nodes = allNodes.filter(n => n.font.tier !== 1);

    gsap.fromTo(t1Nodes,
      { opacity: 0, scale: 0.6, y: 14 },
      { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.2)',
        stagger: { each: 0.015, from: 'center' },
        onComplete: startAmbientDrift,
      });

    t23Nodes.forEach(({ el, font }, i) => {
      gsap.fromTo(el,
        { opacity: 0, scale: 0.6, y: 14 },
        { opacity: TIER_OPACITY[font.tier], scale: 1, y: 0,
          duration: 0.9, ease: 'power3.out',
          delay: 0.012 * i,
        });
    });
  });

  // ── Ambient drift ────────────────────────────────────────────────────────────
  function makeDrift(font: UniverseFont, el: HTMLDivElement, delayScale = 4) {
    const { h1, h2 } = idHash(font.id);
    return gsap.to(el, {
      x: `+=${(h1 * 2 - 1) * 3}`,
      y: `+=${(h2 * 2 - 1) * 5}`,
      duration: 6 + h1 * 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: h2 * delayScale,
    });
  }

  function startAmbientDrift() {
    if (prefersReducedMotion() || ambientTweens.current.size > 0) return;
    FONT_UNIVERSE.forEach(font => {
      const el = nodeRefs.current.get(font.id);
      if (el) ambientTweens.current.set(font.id, makeDrift(font, el));
    });
    startHeartbeat();
  }

  // ── Idle heartbeat — tier-1 nodes pulse now and then to keep the field alive ─
  const hoveredIdRef = useRef<string | null>(null);
  const heartbeatFn = useRef<((id: string) => void) | null>(null);
  heartbeatFn.current = (id: string) => {
    const delay = 4000 + Math.random() * 4000;
    const timer = setTimeout(() => {
      if (modeRef.current !== 'idle' || hoveredIdRef.current === id) {
        heartbeatFn.current?.(id);
        return;
      }
      const el = nodeRefs.current.get(id);
      if (!el) return;
      gsap.to(el, {
        scale: 1.06,
        duration: 0.35,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        overwrite: false,
        onComplete: () => heartbeatFn.current?.(id),
        // If another tween takes over the scale, keep the rhythm going anyway
        onInterrupt: () => heartbeatFn.current?.(id),
      });
    }, delay);
    heartbeatTimers.current.set(id, timer);
  };

  function startHeartbeat() {
    FONT_UNIVERSE.filter(f => f.tier === 1).forEach((f, i) => {
      later(() => heartbeatFn.current?.(f.id), i * 300);
    });
  }

  function stopAmbientDrift(ids?: string[]) {
    const targets = ids ?? [...ambientTweens.current.keys()];
    targets.forEach(id => ambientTweens.current.get(id)?.pause());
  }

  // ── Connections ──────────────────────────────────────────────────────────────
  const buildConnections = useCallback((
    font: UniverseFont,
    srcPosOverride?: NodePos,
  ): ConnectionLine[] => {
    const partners = (COMPAT_MAP.get(font.id) ?? []).slice(0, 5);
    const maxScore = partners[0]?.score ?? 1;
    const minScore = partners[partners.length - 1]?.score ?? 0;
    const range = maxScore - minScore || 1;

    const srcPos = srcPosOverride ?? positions.get(font.id);
    if (!srcPos) return [];

    return partners.map((partner, i) => {
      const tgtFont = FONT_MAP.get(partner.id);
      const tgtPos  = orbitPosRef.current.get(partner.id) ?? positions.get(partner.id);
      if (!tgtFont || !tgtPos) return null;

      const normalizedCompat = (partner.score - minScore) / range;
      const color = REL_COLORS[relType(font, tgtFont)];

      const dx = tgtPos.x - srcPos.x;
      const dy = tgtPos.y - srcPos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const x1 = srcPos.x + (dx / dist) * LINE_STANDOFF;
      const y1 = srcPos.y + (dy / dist) * LINE_STANDOFF;
      const x2 = tgtPos.x - (dx / dist) * LINE_STANDOFF;
      const y2 = tgtPos.y - (dy / dist) * LINE_STANDOFF;

      const mid = bezierMidpoint(x1, y1, x2, y2, normalizedCompat);
      return {
        key: `${font.id}-${partner.id}`,
        path: bezierPath(x1, y1, x2, y2, normalizedCompat),
        color,
        dashLen: dist * 1.3,
        label: annotationCopy(font, tgtFont),
        midX: mid.x,
        midY: mid.y,
        delay: i * 0.05,
        partnerId: partner.id,
        dashed: bothDevanagari(font, tgtFont),
      } as ConnectionLine;
    }).filter((c): c is ConnectionLine => c !== null);
  }, [positions]);

  // ── Hover / focus ────────────────────────────────────────────────────────────
  const handleEnter = useCallback((id: string) => {
    if (modeRef.current === 'paired') return;

    // Anchored: hovering or focusing a partner shows how it relates to the anchor
    if (modeRef.current === 'anchored') {
      const anchorId = anchorRef.current;
      if (!anchorId || id === anchorId) return;
      const vp = orbitPosRef.current.get(id);
      if (!vp) return;
      const anchorFont  = FONT_MAP.get(anchorId);
      const partnerFont = FONT_MAP.get(id);
      if (!anchorFont || !partnerFont) return;
      setTooltip({
        partnerId: id,
        label: annotationCopy(anchorFont, partnerFont),
        color: REL_COLORS[relType(anchorFont, partnerFont)],
        x: vp.x,
        y: vp.y,
      });
      return;
    }

    hoveredIdRef.current = id;
    onHover(id);

    const font = FONT_MAP.get(id);
    const el   = nodeRefs.current.get(id);
    if (!font || !el) return;
    const rm = prefersReducedMotion();

    const push = el.querySelector('.fn-push');
    if (push && !rm) gsap.to(push, { scale: 1.15, duration: 0.3, ease: 'back.out(1.8)', overwrite: 'auto' });
    gsap.to(el, { opacity: 1, duration: 0.2, overwrite: 'auto' });
    const ring = el.querySelector('.fn-ring');
    if (ring) gsap.to(ring, { opacity: 0.3, duration: 0.3, ease: 'power2.out' });
    const nm = el.querySelector('.fn-name');
    if (nm) gsap.to(nm, { opacity: 1, duration: 0.25, ease: 'power2.out' });

    // Dim everything that isn't connected, never below the contrast floor
    const connectedIds = new Set((COMPAT_MAP.get(id) ?? []).slice(0, 5).map(p => p.id));
    FONT_UNIVERSE.forEach(f => {
      if (f.id === id || connectedIds.has(f.id)) return;
      const otherEl = nodeRefs.current.get(f.id);
      if (otherEl) gsap.to(otherEl, { opacity: Math.max(DIM_FLOOR, TIER_OPACITY[f.tier] * 0.75), duration: 0.3, overwrite: 'auto' });
    });

    // Neighbours make room (within 120px) — on the push layer, absolute values
    const srcPos = positions.get(id);
    if (srcPos && !rm) {
      FONT_UNIVERSE.forEach(f => {
        if (f.id === id) return;
        const p = positions.get(f.id);
        if (!p) return;
        const dist = Math.hypot(p.x - srcPos.x, p.y - srcPos.y);
        const nb = nodeRefs.current.get(f.id)?.querySelector('.fn-push');
        if (!nb) return;
        if (dist < 120 && dist > 0) {
          gsap.to(nb, { x: ((p.x - srcPos.x) / dist) * 8, y: ((p.y - srcPos.y) / dist) * 8, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
        }
      });
    }

    setConnections(buildConnections(font));
  }, [onHover, positions, buildConnections]);

  const handleLeave = useCallback((id: string) => {
    if (modeRef.current === 'paired') return;

    if (modeRef.current === 'anchored') {
      setTooltip(t => (t && t.partnerId === id ? null : t));
      return;
    }

    if (hoveredIdRef.current !== id) return;
    hoveredIdRef.current = null;
    onHover(null);

    const el = nodeRefs.current.get(id);
    const font = FONT_MAP.get(id);
    if (el && font) {
      const push = el.querySelector('.fn-push');
      if (push) gsap.to(push, { scale: 1, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
      const ring = el.querySelector('.fn-ring');
      if (ring) gsap.to(ring, { opacity: 0, duration: 0.2, ease: 'power2.in' });
      const nm = el.querySelector('.fn-name');
      if (nm) gsap.to(nm, { opacity: nameIdle(font.tier), duration: 0.2, ease: 'power2.in' });
    }

    // Restore all nodes and every push layer
    FONT_UNIVERSE.forEach(f => {
      const otherEl = nodeRefs.current.get(f.id);
      if (!otherEl) return;
      gsap.to(otherEl, { opacity: TIER_OPACITY[f.tier], duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
      const nb = otherEl.querySelector('.fn-push');
      if (nb && f.id !== id) gsap.to(nb, { x: 0, y: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
    });

    later(() => {
      if (hoveredIdRef.current === null && modeRef.current === 'idle') setConnections([]);
    }, 280);
  }, [onHover]);

  // ── Make fonts active / inactive (faded fonts can't be clicked or tabbed) ────
  function setActive(el: HTMLDivElement, active: boolean) {
    el.style.pointerEvents = active ? 'auto' : 'none';
    el.tabIndex = active ? 0 : -1;
    if (active) el.removeAttribute('aria-hidden');
    else el.setAttribute('aria-hidden', 'true');
  }

  // ── Anchor layout ────────────────────────────────────────────────────────────
  function layoutAnchor(anchorId: string, instant: boolean) {
    const anchorEl   = nodeRefs.current.get(anchorId);
    const anchorFont = FONT_MAP.get(anchorId);
    if (!anchorEl || !anchorFont) return;
    const rm = prefersReducedMotion();
    const d = (s: number) => (instant ? 0 : s);

    // Clear any hover state left on the push layers
    hoveredIdRef.current = null;
    nodeRefs.current.forEach(el => {
      const nb = el.querySelector('.fn-push');
      if (nb) gsap.to(nb, { x: 0, y: 0, scale: 1, duration: d(0.2), overwrite: 'auto' });
      const ring = el.querySelector('.fn-ring');
      if (ring) gsap.to(ring, { opacity: 0, duration: d(0.2) });
    });

    const anchorBasePos = positions.get(anchorId) ?? { x: 0, y: 0 };
    const center = { x: w * 0.5, y: h * 0.5 };
    const anchorTarget = Math.min(w, h) < 600 ? 34 : 48;
    const anchorScale = Math.max(anchorTarget, GLYPH_SIZE[anchorFont.tier] * 1.4) / GLYPH_SIZE[anchorFont.tier];

    setConnections([]);
    setTooltip(null);
    const drift = ambientTweens.current.get(anchorId);
    if (drift) { drift.kill(); ambientTweens.current.delete(anchorId); }
    setActive(anchorEl, true);

    const afterLanding = () => {
      if (!instant && !rm && shockwaveRef.current) {
        gsap.set(shockwaveRef.current, { left: center.x - 220, top: center.y - 220, scale: 0.09, opacity: 0.5 });
        gsap.to(shockwaveRef.current, { scale: 1, opacity: 0, duration: 1.1, ease: 'power2.out' });
      }
      later(() => {
        if (anchorRef.current !== anchorId) return;
        const lines = buildConnections(anchorFont, center);
        setConnections(lines);
        const top1 = lines[0];
        // On phones the hint would cover the anchor; tapping a partner opens the pair anyway
        if (top1 && Math.min(w, h) >= 600) {
          const vp = orbitPosRef.current.get(top1.partnerId) ?? positions.get(top1.partnerId) ?? { x: 0, y: 0 };
          setTooltip({ partnerId: top1.partnerId, label: top1.label, color: top1.color, x: vp.x, y: vp.y });
        }
      }, instant ? 0 : 500);
    };

    // Arc flight — two desynchronized tweens
    gsap.to(anchorEl, { x: center.x - anchorBasePos.x, duration: d(0.85), ease: 'power2.inOut', overwrite: 'auto' });
    gsap.to(anchorEl, { y: center.y - anchorBasePos.y, duration: d(0.85), ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(anchorEl, {
      scale: anchorScale, opacity: 1, duration: d(0.85), ease: 'back.out(1.15)', overwrite: 'auto',
      onComplete: afterLanding,
    });
    const anchorName = anchorEl.querySelector('.fn-name');
    // On phones the bottom bar already names the anchor, so its label stays hidden
    // The name is counter-scaled so it stays a readable label, not a headline
    if (anchorName) gsap.to(anchorName, {
      opacity: Math.min(w, h) < 600 ? 0 : 0.9,
      scale: 1.25 / anchorScale, transformOrigin: '50% 0%',
      duration: d(0.5), delay: d(0.4), ease: 'power2.out',
    });

    const reorganize = () => {
      const partners = COMPAT_MAP.get(anchorId) ?? [];
      const orbitPairs: { id: string; semanticPos: NodePos }[] = [];
      for (const p of partners.slice(0, ORBIT_COUNT)) {
        const semanticPos = positions.get(p.id);
        if (semanticPos) orbitPairs.push({ id: p.id, semanticPos });
      }
      const topPartnerIds = new Set(orbitPairs.map(p => p.id));

      orbitPosRef.current.clear();
      const orbitTargets = orbitPositions(center, orbitPairs.map(p => p.semanticPos), w, h);

      orbitPairs.forEach(({ id }, i) => {
        const el = nodeRefs.current.get(id);
        const target = orbitTargets[i];
        if (!el || !target) return;
        orbitPosRef.current.set(id, target);
        const dt = ambientTweens.current.get(id);
        if (dt) { dt.kill(); ambientTweens.current.delete(id); }
        setActive(el, true);

        const isInner = i < INNER_COUNT;
        const basePos = positions.get(id) ?? { x: 0, y: 0 };
        gsap.to(el, {
          x: target.x - basePos.x,
          y: target.y - basePos.y,
          scale: 1,
          opacity: isInner ? 1.0 : 0.8,
          duration: d(1.1),
          ease: isInner ? 'back.out(1.05)' : 'power3.inOut',
          delay: d(0.015 * i),
          overwrite: 'auto',
        });
        // Every partner shows its name, so you know what you're looking at
        const nm = el.querySelector('.fn-name');
        if (nm) gsap.to(nm, { opacity: 1, duration: d(0.4), delay: d(0.5) });
      });

      // Periphery — pushed out past the orbit, faded, and made inactive
      FONT_UNIVERSE.forEach((font, fontIdx) => {
        if (font.id === anchorId || topPartnerIds.has(font.id)) return;
        const el = nodeRefs.current.get(font.id);
        if (!el) return;
        const basePos = positions.get(font.id) ?? { x: 0, y: 0 };
        const target = peripheryPos(basePos, center, w, h);
        stopAmbientDrift([font.id]);
        setActive(el, false);
        gsap.to(el, {
          x: target.x - basePos.x,
          y: target.y - basePos.y,
          scale: 1,
          opacity: PERIPHERY_OPACITY,
          duration: d(1.1),
          ease: 'power3.inOut',
          delay: d(0.015 * fontIdx * 0.5),
          overwrite: 'auto',
        });
        const nm = el.querySelector('.fn-name');
        if (nm) gsap.to(nm, { opacity: 0, duration: d(0.3) });
      });
    };
    if (instant) reorganize(); else later(reorganize, 100);
  }

  // ── Anchor state changes (and viewport changes while anchored) ──────────────
  useEffect(() => {
    const prev = prevAnchorId.current;
    const next = state.anchorId;
    const sizeChanged = prevSize.current.w !== w || prevSize.current.h !== h;
    prevAnchorId.current = next;
    prevSize.current = { w, h };

    if (next && next !== prev) {
      layoutAnchor(next, false);
      const font = FONT_MAP.get(next);
      const partners = (COMPAT_MAP.get(next) ?? []).slice(0, ORBIT_COUNT);
      const best = partners[0] ? FONT_MAP.get(partners[0].id)?.name : null;
      if (font) setAnnounce(`${font.name} selected. ${partners.length} suggested partners${best ? `, best match ${best}` : ''}. Choose one to see the pair, or press Escape to go back.`);
    } else if (next && sizeChanged) {
      layoutAnchor(next, true);
    } else if (!next && prev) {
      orbitPosRef.current.clear();
      setConnections([]);
      setTooltip(null);
      setAnnounce('Back to all 150 fonts.');
      const rm = prefersReducedMotion();

      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (!el) return;
        setActive(el, true);
        const delay = rm ? 0 : Math.random() * 0.4;
        gsap.to(el, {
          x: 0,
          y: 0,
          scale: 1,
          opacity: TIER_OPACITY[font.tier],
          duration: 0.9,
          ease: 'power3.inOut',
          delay,
          overwrite: 'auto',
          onComplete: () => {
            ambientTweens.current.get(font.id)?.kill();
            ambientTweens.current.delete(font.id);
            if (!rm) ambientTweens.current.set(font.id, makeDrift(font, el, 2));
          },
        });
        const nm = el.querySelector('.fn-name');
        if (nm) gsap.to(nm, { opacity: nameIdle(font.tier), scale: 1, duration: 0.4, delay, ease: 'power2.inOut' });
      });
      // Keep keyboard users where they were
      if (prev) later(() => nodeRefs.current.get(prev)?.focus({ preventScroll: true }), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.anchorId, w, h]);

  // ── Paired state — dim the field ─────────────────────────────────────────────
  useEffect(() => {
    const was = prevMode.current;
    prevMode.current = state.mode;
    if (state.mode === 'paired') {
      setConnections([]);
      setTooltip(null);
      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (el) gsap.to(el, { opacity: 0.08, duration: 0.4, ease: 'power2.inOut' });
      });
    } else if (state.mode === 'anchored' && state.anchorId && was === 'paired') {
      const partners = COMPAT_MAP.get(state.anchorId) ?? [];
      const topIds   = new Set(partners.slice(0, ORBIT_COUNT).map(p => p.id));
      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (!el) return;
        if (font.id === state.anchorId) {
          gsap.to(el, { opacity: 1, duration: 0.4 });
        } else if (topIds.has(font.id)) {
          const i = partners.findIndex(p => p.id === font.id);
          gsap.to(el, { opacity: i < INNER_COUNT ? 1 : 0.8, duration: 0.4 });
        } else {
          gsap.to(el, { opacity: PERIPHERY_OPACITY, duration: 0.4 });
        }
      });
      const anchorFont = FONT_MAP.get(state.anchorId);
      if (anchorFont) later(() => setConnections(buildConnections(anchorFont, { x: w * 0.5, y: h * 0.5 })), 300);
      // Return focus to the partner that opened the specimen
      const pid = lastPartnerId.current;
      if (pid) later(() => nodeRefs.current.get(pid)?.focus({ preventScroll: true }), 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode]);

  // ── Click / Enter ─────────────────────────────────────────────────────────────
  const handleActivate = useCallback((id: string) => {
    // While anchored, only the anchor and its partners respond
    if (modeRef.current === 'anchored' && id !== anchorRef.current && !orbitPosRef.current.has(id)) return;
    onSelect(id);
  }, [onSelect]);

  const anchorName = state.anchorId ? FONT_MAP.get(state.anchorId)?.name : '';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}
      inert={state.mode === 'paired'}
    >
      <svg
        ref={svgRef}
        width={w}
        height={h}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      >
        {/* Faint concentric ring guides — decorative */}
        {[0.18, 0.36, 0.54, 0.72, 0.90].map((frac, i) => (
          <circle
            key={`ring-${i}`}
            cx={w * 0.5}
            cy={h * 0.5}
            r={Math.min(w * 0.46, h * 0.47) * frac}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={0.5}
            opacity={0.05}
          />
        ))}
        {connections.map(conn => (
          <AnimatedConnection key={conn.key} conn={conn} />
        ))}
      </svg>

      {/* Shockwave ring */}
      <div
        ref={shockwaveRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          width: 440,
          height: 440,
          borderRadius: '50%',
          border: '1.5px solid var(--ink)',
          pointerEvents: 'none',
          opacity: 0,
          transformOrigin: 'center center',
          zIndex: 2,
        }}
      />

      {/* Font layer */}
      <div
        role="group"
        aria-label="Font map"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {orderedFonts.map(font => {
          const pos = positions.get(font.id) ?? { x: 0, y: 0 };
          return (
            <FontNameplate
              key={font.id}
              font={font}
              x={pos.x}
              y={pos.y}
              nodeRef={setNodeRef(font.id)}
              onActivate={handleActivate}
              onEnter={handleEnter}
              onLeave={handleLeave}
            />
          );
        })}
      </div>

      {tooltip && <PartnerTooltip key={tooltip.partnerId} tt={tooltip} />}

      {/* Anchored bar — what to do next, and a real way back */}
      {state.mode === 'anchored' && (
        <div className="anchor-bar">
          <button className="ts-btn" onClick={onBack} aria-label="Back to all fonts">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M12 7H2M6 3L2 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            All fonts
          </button>
          <span className="anchor-bar__hint">Pick a partner for {anchorName}</span>
        </div>
      )}

      <div className="sr-only" aria-live="polite">{announce}</div>
    </div>
  );
}

// ── AnimatedConnection — draws in on mount ────────────────────────────────────
function AnimatedConnection({ conn }: { conn: ConnectionLine }) {
  const pathRef  = useRef<SVGPathElement>(null);
  const dot1Ref  = useRef<SVGCircleElement>(null);
  const dot2Ref  = useRef<SVGCircleElement>(null);

  const parts = conn.path.split(' ');
  const x1 = parseFloat(parts[1]);
  const y1 = parseFloat(parts[2]);
  const x2 = parseFloat(parts[parts.length - 2]);
  const y2 = parseFloat(parts[parts.length - 1]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (conn.dashed) {
      // Dashed lines keep their dash pattern, so they fade in instead of drawing
      path.style.strokeDasharray = DASH;
      path.style.strokeDashoffset = '0';
      gsap.fromTo(path, { opacity: 0 }, { opacity: 0.9, duration: 0.45, ease: 'power2.out', delay: conn.delay });
    } else {
      // Measure the real curve so the line always draws all the way to the font
      const len = path.getTotalLength?.() || conn.dashLen;
      path.style.strokeDasharray = `${len}`;
      gsap.fromTo(path,
        { strokeDashoffset: len, opacity: 0.9 },
        { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out', delay: conn.delay },
      );
    }
    if (dot1Ref.current) {
      gsap.fromTo(dot1Ref.current,
        { scale: 0, transformOrigin: 'center' },
        { scale: 1, duration: 0.2, ease: 'back.out(2)', delay: conn.delay },
      );
    }
    if (dot2Ref.current) {
      gsap.fromTo(dot2Ref.current,
        { scale: 0, transformOrigin: 'center' },
        { scale: 1, duration: 0.2, ease: 'back.out(2)', delay: conn.delay + 0.35 },
      );
    }
  }, [conn]);

  return (
    <g>
      <path
        ref={pathRef}
        d={conn.path}
        fill="none"
        stroke={conn.color}
        strokeWidth={1.4}
        opacity={0.9}
        strokeDasharray={conn.dashed ? DASH : conn.dashLen}
        strokeDashoffset={conn.dashed ? 0 : conn.dashLen}
      />
      <circle ref={dot1Ref} cx={x1} cy={y1} r={3} fill={conn.color} />
      <circle ref={dot2Ref} cx={x2} cy={y2} r={3} fill={conn.color} />
    </g>
  );
}
