import {
  useRef, useCallback, useEffect, useMemo, useState, memo,
} from 'react';
import gsap from 'gsap';
import { FONT_UNIVERSE } from '../data/universe';
import type { UniverseFont } from '../data/universe';
import { computePositions, orbitPositions, peripheryPos } from '../data/computed-layout';
import type { NodePos } from '../data/computed-layout';
import {
  getCompatMap, relType, REL_COLORS, annotationCopy,
  bezierPath, bezierMidpoint,
} from '../data/compat';
import { useViewport } from '../hooks/useViewport';
import type { AppState } from '../hooks/useAppState';

// ── Constants ────────────────────────────────────────────────────────────────
// Star magnitudes — Aa at three sizes creates foreground / midground / background depth
const GLYPH_SIZE: Record<1 | 2 | 3, number> = { 1: 24, 2: 16, 3: 11 };
const TIER_OPACITY: Record<1 | 2 | 3, number> = { 1: 1.0, 2: 0.65, 3: 0.30 };
const LINE_STANDOFF = 8; // px

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
}

// ── Compat map (module-level singleton) ──────────────────────────────────────
const COMPAT_MAP = getCompatMap(FONT_UNIVERSE);
const FONT_MAP = new Map(FONT_UNIVERSE.map(f => [f.id, f]));

// ── FontNameplate ─────────────────────────────────────────────────────────────
interface NameplateProps {
  font: UniverseFont;
  x: number;
  y: number;
  nodeRef: (el: HTMLDivElement | null) => void;
  onClick: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

const FontNameplate = memo(function FontNameplate({
  font, x, y, nodeRef, onClick, onPointerEnter, onPointerLeave,
}: NameplateProps) {
  const glyphSize = GLYPH_SIZE[font.tier];

  return (
    <div
      ref={nodeRef}
      className="fn-node"
      role="button"
      aria-label={`${font.name}, ${font.category}`}
      tabIndex={0}
      data-id={font.id}
      // left/top = semantic center; GSAP owns x/y/scale/opacity transforms.
      // Inner wrapper uses CSS translate(-50%,-50%) to visually center the glyph
      // on (x,y) without touching GSAP's transform system.
      style={{
        left: x,
        top: y,
        opacity: 0,
        willChange: 'transform, opacity',
      }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {/* Inner centering wrapper — CSS only, never touched by GSAP */}
      <div style={{
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        display: 'inline-block',
        position: 'relative',
      }}>

        {/* Hover ring — Typoverse-style circle, fades in on hover via GSAP */}
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

        {/* Primary node — 'Aa' in each font's own typeface.
            150 fonts solving the same design problem. The field IS the comparison. */}
        <div
          className="fn-glyph"
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

        {/* Name label — tier 1: always dim, tier 2-3: hover-reveal via GSAP */}
        <div
          className="fn-name"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 9,
            color: 'var(--ink)',
            opacity: font.tier === 1 ? 0.38 : 0,
            marginTop: 4,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          {font.name}
        </div>
      </div>
    </div>
  );
});

// ── Partner annotation tooltip ────────────────────────────────────────────────
// Appears near the partner node; key prop on partnerId triggers remount+re-anim
// each time a different partner is hovered.
function PartnerTooltip({ tt }: { tt: TooltipState }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
      );
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: tt.x,
        top: tt.y + 28,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 20,
        opacity: 0,
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(6, 6, 6, 0.92)',
        border: `1px solid ${tt.color}28`,
        borderLeft: `2px solid ${tt.color}`,
        borderRadius: '0 3px 3px 0',
        padding: '5px 10px 5px 8px',
        fontFamily: 'var(--font-ui)',
        fontSize: 9,
        color: tt.color,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {tt.label}
      </div>
    </div>
  );
}

// ── Main SpatialMap component ─────────────────────────────────────────────────
export function SpatialMap({ state, onSelect, onHover }: Props) {
  const { w, h } = useViewport();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const ambientTweens = useRef<Map<string, gsap.core.Tween>>(new Map());
  const ambientStarted = useRef(false);
  const prevAnchorId = useRef<string | null>(null);
  // Tracks where partners land during anchor state so connection lines draw accurately
  const orbitPosRef = useRef<Map<string, NodePos>>(new Map());
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(state.mode);
  const heartbeatTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Keep modeRef current for setTimeout callbacks (avoids stale closure)
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);

  // ── Semantic positions (memoized on viewport size) ──────────────────────────
  const positions = useMemo(() => computePositions(FONT_UNIVERSE, w, h), [w, h]);

  // ── Register node refs ──────────────────────────────────────────────────────
  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else    nodeRefs.current.delete(id);
  }, []);

  // ── Field entrance animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (ambientStarted.current || nodeRefs.current.size < 10) return;
    ambientStarted.current = true;

    // Positions by tier for stagger order
    const allNodes: { el: HTMLDivElement; font: UniverseFont }[] = [];
    FONT_UNIVERSE.forEach(font => {
      const el = nodeRefs.current.get(font.id);
      if (el) allNodes.push({ el, font });
    });

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      // Tier 1 with back.out swagger
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

    gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
      allNodes.forEach(({ el, font }) => {
        gsap.set(el, { opacity: TIER_OPACITY[font.tier], scale: 1 });
      });
      startAmbientDrift();
    });
  });

  // ── Ambient drift ────────────────────────────────────────────────────────────
  function startAmbientDrift() {
    if (ambientTweens.current.size > 0) return;

    FONT_UNIVERSE.forEach(font => {
      const el = nodeRefs.current.get(font.id);
      if (!el) return;

      // Deterministic offsets from font id hash
      const h1 = (font.id.charCodeAt(0) * 7 + font.id.charCodeAt(1) * 3) % 100 / 100;
      const h2 = (font.id.charCodeAt(2) * 11 + font.id.length * 5) % 100 / 100;
      const jx = h1 * 2 - 1;
      const jy = h2 * 2 - 1;
      const dur = 6 + h1 * 5;

      const t = gsap.to(el, {
        x: `+=${jx * 3}`,
        y: `+=${jy * 5}`,
        duration: dur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: h2 * 4,
      });
      ambientTweens.current.set(font.id, t);
    });

    // Kick off heartbeat pulses for tier-1 nodes after drift is running
    startHeartbeat();
  }

  // ── Idle heartbeat — tier-1 nodes pulse randomly to keep the field alive ─────
  // Ref pattern for recursive setTimeout without stale-closure issues.
  const heartbeatFn = useRef<((id: string) => void) | null>(null);
  heartbeatFn.current = (id: string) => {
    const delay = 4000 + Math.random() * 4000; // 4–8 s between pulses
    const timer = setTimeout(() => {
      // Skip if not idle or node is currently hovered (avoids scale conflicts)
      if (modeRef.current !== 'idle' || hoveredIdRef.current === id) {
        heartbeatFn.current?.(id); // reschedule silently
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
        overwrite: false, // drift owns x/y; heartbeat only touches scale
        onComplete: () => heartbeatFn.current?.(id),
      });
    }, delay);
    heartbeatTimers.current.set(id, timer);
  };

  function startHeartbeat() {
    // Short initial stagger so first pulses begin within a few seconds
    FONT_UNIVERSE.filter(f => f.tier === 1).forEach((f, i) => {
      setTimeout(() => heartbeatFn.current?.(f.id), i * 300);
    });
  }

  function stopAmbientDrift(ids?: string[]) {
    const targets = ids ?? [...ambientTweens.current.keys()];
    targets.forEach(id => {
      ambientTweens.current.get(id)?.pause();
    });
  }

  // ── Hover ────────────────────────────────────────────────────────────────────
  const buildConnections = useCallback((
    font: UniverseFont,
    srcPosOverride?: NodePos,   // pass visual position when font has moved (anchor state)
  ): ConnectionLine[] => {
    const partners = (COMPAT_MAP.get(font.id) ?? []).slice(0, 5);
    const maxScore = partners[0]?.score ?? 1;
    const minScore = partners[partners.length - 1]?.score ?? 0;
    const range = maxScore - minScore || 1;

    const srcPos = srcPosOverride ?? positions.get(font.id);
    if (!srcPos) return [];

    return partners.map((partner, i) => {
      const tgtFont = FONT_MAP.get(partner.id);
      // Use orbit position if available (partners move to orbit in anchor state)
      const tgtPos  = orbitPosRef.current.get(partner.id) ?? positions.get(partner.id);
      if (!tgtFont || !tgtPos) return null;

      const normalizedCompat = (partner.score - minScore) / range;
      const rt = relType(font, tgtFont);
      const color = REL_COLORS[rt];

      // Standoff points
      const dx = tgtPos.x - srcPos.x;
      const dy = tgtPos.y - srcPos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const x1 = srcPos.x + (dx / dist) * LINE_STANDOFF;
      const y1 = srcPos.y + (dy / dist) * LINE_STANDOFF;
      const x2 = tgtPos.x - (dx / dist) * LINE_STANDOFF;
      const y2 = tgtPos.y - (dy / dist) * LINE_STANDOFF;

      const pathD = bezierPath(x1, y1, x2, y2, normalizedCompat);
      const mid   = bezierMidpoint(x1, y1, x2, y2, normalizedCompat);

      return {
        key: `${font.id}-${partner.id}`,
        path: pathD,
        color,
        dashLen: dist,
        label: annotationCopy(font, tgtFont),
        midX: mid.x,
        midY: mid.y,
        delay: i * 0.05,
        partnerId: partner.id,
      } as ConnectionLine;
    }).filter((c): c is ConnectionLine => c !== null);
  }, [positions]);

  const hoveredIdRef = useRef<string | null>(null);

  const handlePointerEnter = useCallback((id: string) => {
    if (state.mode === 'paired') return;

    // ── Anchored mode: hover orbit partner → show annotation tooltip ────────────
    // Gate strictly on orbitPosRef — only the 12 orbit partners are stored there.
    // Periphery fonts are NOT in orbitPosRef, so they fall through and return early.
    // This prevents (a) tooltip firing for every font, and (b) position using the
    // stale ring position instead of the actual visual orbit position.
    if (state.mode === 'anchored') {
      if (!state.anchorId || id === state.anchorId) return;
      const vp = orbitPosRef.current.get(id);
      if (!vp) return; // not an orbit partner — skip
      const anchorFont  = FONT_MAP.get(state.anchorId);
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

    // Lift glyph
    gsap.to(el, { scale: 1.15, duration: 0.3, ease: 'back.out(1.8)', overwrite: 'auto' });
    // Ring fades in
    const ring = el.querySelector('.fn-ring') as HTMLElement | null;
    if (ring) gsap.to(ring, { opacity: 0.18, duration: 0.35, ease: 'power2.out' });
    // Surface name label (tier 2-3 start at 0; tier 1 bumps from 0.38)
    const nm = el.querySelector('.fn-name') as HTMLElement | null;
    if (nm) gsap.to(nm, { opacity: 0.85, duration: 0.25, ease: 'power2.out' });

    // Dim non-connected nodes
    const connectedIds = new Set((COMPAT_MAP.get(id) ?? []).slice(0, 5).map(p => p.id));
    FONT_UNIVERSE.forEach(f => {
      if (f.id === id || connectedIds.has(f.id)) return;
      const otherEl = nodeRefs.current.get(f.id);
      if (otherEl) {
        gsap.to(otherEl, { opacity: TIER_OPACITY[f.tier] * 0.75, duration: 0.3, overwrite: 'auto' });
      }
    });

    // Neighbors make room (within 120px)
    const srcPos = positions.get(id);
    if (srcPos) {
      FONT_UNIVERSE.forEach(f => {
        if (f.id === id) return;
        const p = positions.get(f.id);
        if (!p) return;
        const dist = Math.hypot(p.x - srcPos.x, p.y - srcPos.y);
        if (dist < 120 && dist > 0) {
          const pushX = ((p.x - srcPos.x) / dist) * 8;
          const pushY = ((p.y - srcPos.y) / dist) * 8;
          const neighborEl = nodeRefs.current.get(f.id);
          if (neighborEl) {
            gsap.to(neighborEl, { x: `+=${pushX}`, y: `+=${pushY}`, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
          }
        }
      });
    }

    // Draw connections
    setConnections(buildConnections(font));
  }, [state.mode, onHover, positions, buildConnections]);

  const handlePointerLeave = useCallback((id: string) => {
    if (state.mode === 'paired') return;

    // ── Anchored mode: cursor can roam freely — only clear tooltip ─────────────
    if (state.mode === 'anchored') {
      setTooltip(null);
      return;
    }

    hoveredIdRef.current = null;
    onHover(null);

    const el = nodeRefs.current.get(id);
    const font = FONT_MAP.get(id);
    if (el && font) {
      gsap.to(el, { scale: 1, opacity: TIER_OPACITY[font.tier], duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
      const ring = el.querySelector('.fn-ring') as HTMLElement | null;
      if (ring) gsap.to(ring, { opacity: 0, duration: 0.2, ease: 'power2.in' });
      const nm = el.querySelector('.fn-name') as HTMLElement | null;
      if (nm) gsap.to(nm, { opacity: font.tier === 1 ? 0.38 : 0, duration: 0.2, ease: 'power2.in' });
    }

    // Restore all nodes
    FONT_UNIVERSE.forEach(f => {
      const otherEl = nodeRefs.current.get(f.id);
      if (otherEl && f.id !== id) {
        gsap.to(otherEl, { opacity: TIER_OPACITY[f.tier], duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
      }
    });

    // Restore neighbors
    const srcPos = positions.get(id);
    if (srcPos) {
      FONT_UNIVERSE.forEach(f => {
        if (f.id === id) return;
        const p = positions.get(f.id);
        if (!p) return;
        const dist = Math.hypot(p.x - srcPos.x, p.y - srcPos.y);
        if (dist < 120) {
          const neighborEl = nodeRefs.current.get(f.id);
          if (neighborEl) {
            gsap.to(neighborEl, { x: 0, y: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
          }
        }
      });
    }

    // Retract connection lines — animate dashOffset before clearing
    setTimeout(() => {
      if (hoveredIdRef.current === null) setConnections([]);
    }, 280);
  }, [state.mode, onHover, positions]);

  // ── Anchor state — field reorganization ──────────────────────────────────────
  useEffect(() => {
    const prev = prevAnchorId.current;
    const next = state.anchorId;
    prevAnchorId.current = next;

    if (next && next !== prev) {
      // New anchor
      const anchorEl   = nodeRefs.current.get(next);
      const anchorFont = FONT_MAP.get(next);
      if (!anchorEl || !anchorFont) return;

      // Anchor flies to viewport centre — the visual heart of the ring system.
      // GSAP delta = target screen pos − node's CSS left/top base position.
      const anchorBasePos  = positions.get(next) ?? { x: 0, y: 0 };
      const anchorVisualX  = w * 0.50;
      const anchorVisualY  = h * 0.50;
      const anchorDeltaX   = anchorVisualX - anchorBasePos.x;
      const anchorDeltaY   = anchorVisualY - anchorBasePos.y;
      const anchorScale  = Math.max(48, GLYPH_SIZE[anchorFont.tier] * 1.6) / GLYPH_SIZE[anchorFont.tier];

      // Clear idle connections, remove hover connections
      setConnections([]);
      stopAmbientDrift([next]);

      // Arc flight — two desynchronized tweens (spec §8.2)
      gsap.to(anchorEl, {
        x: anchorDeltaX, duration: 0.85, ease: 'power2.inOut', overwrite: 'auto',
      });
      gsap.to(anchorEl, {
        y: anchorDeltaY, duration: 0.85, ease: 'power3.inOut', overwrite: 'auto',
      });
      gsap.to(anchorEl, {
        scale: anchorScale, duration: 0.85, ease: 'back.out(1.15)', overwrite: 'auto',
        onComplete: () => {
          // Shockwave — single expanding ring from landing point (CSS div, not SVG — React won't reset it)
          if (shockwaveRef.current) {
            gsap.set(shockwaveRef.current, {
              left: anchorVisualX - 220,
              top: anchorVisualY - 220,
              scale: 0.09,
              opacity: 0.7,
            });
            gsap.to(shockwaveRef.current, {
              scale: 1,
              opacity: 0,
              duration: 1.1,
              ease: 'power2.out',
            });
          }
          // Draw connections after partners are fully settled.
          // Orbit anims: 1100ms duration, first fires at t+100ms → done by t+1200ms.
          // This setTimeout fires at t+500ms after anchor lands (anchor takes ~850ms),
          // so total from click = ~1350ms — all 12 orbit partners are at rest.
          setTimeout(() => {
            const lines = buildConnections(anchorFont, { x: anchorVisualX, y: anchorVisualY });
            setConnections(lines);

            // Auto-show top-1 partner annotation as a discovery hint
            const top1 = lines[0];
            if (top1) {
              const vp = orbitPosRef.current.get(top1.partnerId) ?? positions.get(top1.partnerId) ?? { x: 0, y: 0 };
              setTooltip({ partnerId: top1.partnerId, label: top1.label, color: top1.color, x: vp.x, y: vp.y });
            }
          }, 500);
        },
      });

      // Name surfaces on anchor (glyph is already the primary node)
      const anchorName = anchorEl.querySelector('.fn-name') as HTMLElement | null;
      if (anchorName) gsap.to(anchorName, { opacity: 0.9, duration: 0.5, delay: 0.4, ease: 'power2.out' });

      // Field reorganization starts 0.1s after anchor launches
      setTimeout(() => {
        const partners = COMPAT_MAP.get(next) ?? [];

        // Build aligned pairs: filter BEFORE separating IDs/positions so index i
        // in the pairs array always corresponds to index i in orbitTargets.
        // (Previous pattern: .map(id=>pos).filter(Boolean) shifts indices when any
        //  position is undefined, so partner A could receive target computed for B.)
        type OrbitPair = { id: string; semanticPos: NodePos };
        const orbitPairs: OrbitPair[] = [];
        for (const p of partners.slice(0, 12)) {
          const semanticPos = positions.get(p.id);
          if (semanticPos) orbitPairs.push({ id: p.id, semanticPos });
        }
        const topPartnerIds = new Set(orbitPairs.map(p => p.id));

        // Partners orbit around the VISUAL centre (where the anchor has flown),
        // not the anchor's original ring position — this keeps lines accurate.
        const anchorVisualCenter = { x: anchorVisualX, y: anchorVisualY };

        // Clear previous orbit positions, then record new ones
        orbitPosRef.current.clear();
        const orbitTargets = orbitPositions(
          anchorVisualCenter,
          orbitPairs.map(p => p.semanticPos),
          w, h,
        );

        // Inner ring (0–4) → outer ring (5–11)
        orbitPairs.forEach(({ id }, i) => {
          const el = nodeRefs.current.get(id);
          if (!el) return;
          const target = orbitTargets[i];
          if (!target) return;
          // Record visual landing position so buildConnections can draw accurate lines
          orbitPosRef.current.set(id, target);

          // Kill drift entirely (not just pause) — paused drift tween holds stale x
          // value. If resumed while node is at orbit_delta, GSAP snaps it back to
          // drift's paused state, making the node jump away from its orbit position.
          const driftTween = ambientTweens.current.get(id);
          if (driftTween) { driftTween.kill(); ambientTweens.current.delete(id); }

          const isInner = i < 5;
          // GSAP x/y are deltas from the node's left/top base position
          const basePos = positions.get(id) ?? { x: 0, y: 0 };

          gsap.to(el, {
            x: target.x - basePos.x,
            y: target.y - basePos.y,
            scale: 1,
            opacity: isInner ? 1.0 : 0.8,
            duration: 1.1,
            ease: isInner ? 'back.out(1.05)' : 'power3.inOut',
            delay: 0.015 * i,
            overwrite: 'auto',
            // No drift resume here — node stays pinned at orbit position.
            // Drift is recreated on anchor release once x returns to 0.
          });
        });

        // Periphery — push radially outward from visual centre and dim
        FONT_UNIVERSE.forEach((font, fontIdx) => {
          if (font.id === next || topPartnerIds.has(font.id)) return;
          const el = nodeRefs.current.get(font.id);
          if (!el) return;
          const curPos = positions.get(font.id)!;
          const target = peripheryPos(curPos, anchorVisualCenter, w, h);
          const basePos = positions.get(font.id) ?? { x: 0, y: 0 };

          stopAmbientDrift([font.id]);
          gsap.to(el, {
            x: target.x - basePos.x,
            y: target.y - basePos.y,
            opacity: 0.15,
            duration: 1.1,
            ease: 'power3.inOut',
            delay: 0.015 * fontIdx,
            overwrite: 'auto',
          });
          ambientTweens.current.get(font.id)?.pause();
        });

      }, 100);

    } else if (!next && prev) {
      // Released — return to idle
      orbitPosRef.current.clear();
      setConnections([]);
      setTooltip(null);

      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (!el) return;

        // Return to base position = GSAP x:0, y:0 (transforms cancel out; left/top holds position)
        const delay = Math.random() * 0.4;
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
            // Kill any stale drift tween (orbit partners had theirs killed; periphery/anchor
            // had theirs paused). Recreate fresh so drift starts cleanly from rest (x=0, y=0).
            ambientTweens.current.get(font.id)?.kill();
            const h1 = (font.id.charCodeAt(0) * 7 + font.id.charCodeAt(1) * 3) % 100 / 100;
            const h2 = (font.id.charCodeAt(2) * 11 + font.id.length * 5) % 100 / 100;
            const jx = h1 * 2 - 1;
            const jy = h2 * 2 - 1;
            const t = gsap.to(el, {
              x: `+=${jx * 3}`,
              y: `+=${jy * 5}`,
              duration: 6 + h1 * 5,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
              delay: h2 * 2,
            });
            ambientTweens.current.set(font.id, t);
          },
        });
        // Restore name label to idle state
        const nm = el.querySelector('.fn-name') as HTMLElement | null;
        if (nm) gsap.to(nm, { opacity: font.tier === 1 ? 0.38 : 0, duration: 0.4, delay, ease: 'power2.inOut' });
      });

    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.anchorId, w, h]);

  // ── Paired state — dim the field ─────────────────────────────────────────────
  useEffect(() => {
    if (state.mode === 'paired') {
      setConnections([]);
      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (el) gsap.to(el, { opacity: 0.08, duration: 0.4, ease: 'power2.inOut' });
      });
    } else if (state.mode === 'anchored' && state.anchorId) {
      // Returning from paired to anchored — restore orbit/periphery opacities
      const partners = COMPAT_MAP.get(state.anchorId) ?? [];
      const topIds   = new Set(partners.slice(0, 12).map(p => p.id));
      FONT_UNIVERSE.forEach(font => {
        const el = nodeRefs.current.get(font.id);
        if (!el) return;
        if (font.id === state.anchorId) {
          gsap.to(el, { opacity: 1, duration: 0.4 });
        } else if (topIds.has(font.id)) {
          const i = partners.findIndex(p => p.id === font.id);
          gsap.to(el, { opacity: i < 5 ? 1 : 0.8, duration: 0.4 });
        } else {
          gsap.to(el, { opacity: 0.15, duration: 0.4 });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode]);

  // ── Click handler ─────────────────────────────────────────────────────────────
  const handleClick = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}
    >
      {/* SVG layer — ring guides beneath connection lines */}
      <svg
        ref={svgRef}
        width={w}
        height={h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      >
        {/* ring guides and connections — shockwave moved to HTML layer below */}

        {/* Faint concentric ring guides — echo the layout structure */}
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

      {/* Shockwave ring — CSS div so React re-renders can't reset GSAP's transform mid-animation */}
      <div
        ref={shockwaveRef}
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

      {/* HTML nameplate layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {FONT_UNIVERSE.map(font => {
          const pos = positions.get(font.id) ?? { x: 0, y: 0 };
          return (
            <FontNameplate
              key={font.id}
              font={font}
              x={pos.x}
              y={pos.y}
              nodeRef={setNodeRef(font.id)}
              onClick={() => handleClick(font.id)}
              onPointerEnter={() => handlePointerEnter(font.id)}
              onPointerLeave={() => handlePointerLeave(font.id)}
            />
          );
        })}
      </div>

      {/* Partner annotation tooltip */}
      {tooltip && <PartnerTooltip key={tooltip.partnerId} tt={tooltip} />}

      {/* Anchored HUD — bottom-center pill */}
      {state.mode === 'anchored' && (
        <div style={{
          position: 'fixed',
          bottom: '4%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          color: 'var(--ink)',
          opacity: 0.6,
          pointerEvents: 'none',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          background: 'rgba(10,10,10,0.75)',
          padding: '7px 16px',
          borderRadius: 3,
          border: '1px solid rgba(236,233,228,0.14)',
          whiteSpace: 'nowrap',
        }}>
          click a partner to pair &nbsp;·&nbsp; esc to exit
        </div>
      )}
    </div>
  );
}

// ── AnimatedConnection — draws in on mount ────────────────────────────────────
// Annotation text is NOT rendered here — it lives in PartnerTooltip near the node.
function AnimatedConnection({ conn }: { conn: ConnectionLine }) {
  const pathRef  = useRef<SVGPathElement>(null);
  const dot1Ref  = useRef<SVGCircleElement>(null);
  const dot2Ref  = useRef<SVGCircleElement>(null);

  // Parse start/end from path ("M x1 y1 Q ...")
  const parts = conn.path.split(' ');
  const x1 = parseFloat(parts[1]);
  const y1 = parseFloat(parts[2]);
  // End is last two tokens
  const x2 = parseFloat(parts[parts.length - 2]);
  const y2 = parseFloat(parts[parts.length - 1]);

  useEffect(() => {
    if (!pathRef.current) return;
    const len = conn.dashLen;

    // Draw in
    gsap.fromTo(pathRef.current,
      { strokeDasharray: len, strokeDashoffset: len, opacity: 0.55 },
      { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out', delay: conn.delay },
    );

    // Dots pop in when line reaches endpoint
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
        strokeWidth={1}
        opacity={0.55}
        strokeDasharray={conn.dashLen}
        strokeDashoffset={conn.dashLen}
      />
      <circle ref={dot1Ref} cx={x1} cy={y1} r={2.5} fill={conn.color} />
      <circle ref={dot2Ref} cx={x2} cy={y2} r={2.5} fill={conn.color} />
    </g>
  );
}
