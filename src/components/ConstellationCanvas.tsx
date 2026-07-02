import {
  useRef, useCallback, useEffect, useLayoutEffect, useState, createRef,
} from 'react';
import gsap from 'gsap';
import { BASE_FONTS } from '../data/fonts';
import { LAYOUT } from '../data/layout';
import type { CanvasState, ContextLabel, Pairing } from '../types';
import { FontNode } from './FontNode';
import { PairingNode } from './PairingNode';
import { ConnectionLine } from './ConnectionLine';
import { HoverCard } from './HoverCard';
import { StarField } from './StarField';
import { IdleLines } from './IdleLines';
import { useViewport } from '../hooks/useViewport';
import { useIdleAnimation } from '../hooks/useIdleAnimation';
import {
  buildExpandTimeline,
  buildCollapseTimeline,
  animateContextFilter,
  animateContextClear,
} from '../animations/expand';

interface Props {
  state: CanvasState;
  onSelectFont: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onSetContext: (ctx: ContextLabel | null) => void;
}

interface CardState { pairing: Pairing; x: number; y: number; }

const FONT_IDS = BASE_FONTS.map(f => f.id);
const MARGIN = 100;

function radialSlots(
  cx: number, cy: number, count: number, radius: number, vw: number, vh: number,
) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2; // start from 12 o'clock
    return {
      x: Math.min(Math.max(cx + Math.cos(angle) * radius, MARGIN), vw - MARGIN),
      y: Math.min(Math.max(cy + Math.sin(angle) * radius, MARGIN), vh - MARGIN),
    };
  });
}

/** Resolve pixel position from layout override or font.position fallback */
function fontPx(fontId: string, fallbackX: number, fallbackY: number, vw: number, vh: number) {
  const pos = LAYOUT[fontId] ?? { x: fallbackX, y: fallbackY };
  return { px: (pos.x / 100) * vw, py: (pos.y / 100) * vh };
}

export function ConstellationCanvas({ state, onSelectFont, onHoverNode, onSetContext }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { w, h } = useViewport();

  // Refs for base font nodes — keyed by font id
  const baseNodeRefs = useRef<Map<string, SVGGElement>>(new Map());
  const setBaseNodeRef = useCallback((id: string) => (el: SVGGElement | null) => {
    if (el) baseNodeRefs.current.set(id, el);
    else baseNodeRefs.current.delete(id);
  }, []);

  // Refs for active pairing nodes + lines (rebuilt each selection)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pairingNodeRefs = useRef<React.RefObject<any>[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRefs = useRef<React.RefObject<any>[]>([]);

  // Running master timeline
  const activeTl = useRef<gsap.core.Timeline | null>(null);

  const [card, setCard] = useState<CardState | null>(null);

  // Rebuild pairing + line refs when selected font changes
  const selectedFont = BASE_FONTS.find(f => f.id === state.selectedFontId) ?? null;

  if (selectedFont) {
    const count = selectedFont.pairings.length;
    if (pairingNodeRefs.current.length !== count) {
      pairingNodeRefs.current = Array.from({ length: count }, () => createRef<SVGGElement>());
      lineRefs.current = Array.from({ length: count }, () => createRef<SVGLineElement>());
    }
  }

  // Idle animation
  useIdleAnimation(baseNodeRefs, FONT_IDS, !state.selectedFontId);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onSelectFont(null); setCard(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelectFont]);

  // ── Expand / collapse on selection change ──────────────────────────────────
  const prevSelectedId = useRef<string | null>(null);

  // useLayoutEffect: runs after DOM paint so pairing node refs are populated
  useLayoutEffect(() => {
    const prev = prevSelectedId.current;
    const next = state.selectedFontId;
    prevSelectedId.current = next;

    // Kill running timeline (interruption handling — §3)
    if (activeTl.current) {
      activeTl.current.kill();
      activeTl.current = null;
    }

    if (next) {
      const font = BASE_FONTS.find(f => f.id === next);
      if (!font) return;

      const { px: bx, py: by } = fontPx(font.id, font.position.x, font.position.y, w, h);
      const radius = Math.min(w, h) * 0.22;
      const slots = radialSlots(bx, by, font.pairings.length, radius, w, h);

      const selectedEl = baseNodeRefs.current.get(next);
      const otherEls = [...baseNodeRefs.current.entries()]
        .filter(([id]) => id !== next)
        .map(([, el]) => el);
      const pairingEls = pairingNodeRefs.current
        .map(r => r.current)
        .filter(Boolean) as SVGGElement[];
      const lineEls = lineRefs.current
        .map(r => r.current)
        .filter(Boolean) as SVGLineElement[];
      const lineLengths = slots.map((slot) => Math.hypot(slot.x - bx, slot.y - by));

      if (!selectedEl) return;

      // If switching from another font, collapse old state quickly first
      const runExpand = () => {
        const tl = buildExpandTimeline({
          otherNodes: otherEls,
          selectedNode: selectedEl,
          pairingNodes: pairingEls,
          lineEls,
          lineLengths,
          baseX: bx,
          baseY: by,
          slotPositions: slots,
        });
        activeTl.current = tl;
        tl.play();
      };

      runExpand();

    } else if (prev) {
      // Collapse
      const font = BASE_FONTS.find(f => f.id === prev);
      if (!font) return;

      const { px: bx, py: by } = fontPx(font.id, font.position.x, font.position.y, w, h);

      const selectedEl = baseNodeRefs.current.get(prev);
      const otherEls = [...baseNodeRefs.current.entries()]
        .filter(([id]) => id !== prev)
        .map(([, el]) => el);
      const pairingEls = pairingNodeRefs.current
        .map(r => r.current)
        .filter(Boolean) as SVGGElement[];
      const lineEls = lineRefs.current
        .map(r => r.current)
        .filter(Boolean) as SVGLineElement[];
      const lineLengths = lineEls.map(line => {
        const dx = Number(line.getAttribute('x2')) - bx;
        const dy = Number(line.getAttribute('y2')) - by;
        return Math.hypot(dx, dy);
      });

      if (!selectedEl) return;

      const tl = buildCollapseTimeline({
        otherNodes: otherEls,
        selectedNode: selectedEl,
        pairingNodes: pairingEls,
        lineEls,
        lineLengths,
        baseX: bx,
        baseY: by,
      });
      activeTl.current = tl;
      tl.play();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFontId, w, h]);

  // ── Context filter animations (§6) ────────────────────────────────────────
  useEffect(() => {
    if (!selectedFont) return;
    const pairingEls = pairingNodeRefs.current.map(r => r.current).filter(Boolean) as SVGGElement[];
    const lineEls = lineRefs.current.map(r => r.current).filter(Boolean) as SVGLineElement[];

    if (!state.activeContext) {
      animateContextClear(pairingEls, lineEls);
      return;
    }

    const matches: SVGGElement[] = [];
    const dims: SVGGElement[] = [];
    const matchLines: SVGLineElement[] = [];
    const dimLines: SVGLineElement[] = [];

    selectedFont.pairings.forEach((p, i) => {
      const node = pairingEls[i];
      const line = lineEls[i];
      const isMatch = p.contexts.includes(state.activeContext!);
      if (node) (isMatch ? matches : dims).push(node);
      if (line) (isMatch ? matchLines : dimLines).push(line);
    });

    animateContextFilter(matches, dims, matchLines, dimLines);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeContext]);

  const handleBgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current) { onSelectFont(null); setCard(null); }
  }, [onSelectFont]);

  const handleFontClick = useCallback((id: string) => {
    const next = state.selectedFontId === id ? null : id;
    onSelectFont(next);
    if (!next) setCard(null);
  }, [state.selectedFontId, onSelectFont]);

  const handleCardShow = useCallback((pairing: Pairing, el: SVGGElement) => {
    const rect = el.getBoundingClientRect();
    setCard({ pairing, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, []);

  // Compute slot positions using layout-aware base coords
  const selPx = selectedFont
    ? fontPx(selectedFont.id, selectedFont.position.x, selectedFont.position.y, w, h)
    : null;
  const slots = selectedFont && selPx
    ? radialSlots(selPx.px, selPx.py, selectedFont.pairings.length, Math.min(w, h) * 0.22, w, h)
    : [];

  return (
    <>
      <svg
        ref={svgRef}
        width={w}
        height={h}
        onClick={handleBgClick}
        aria-label="Font constellation canvas"
        role="application"
        style={{ position: 'fixed', inset: 0, display: 'block', background: '#0a0a0a' }}
      >
        {/* Star field atmosphere */}
        <StarField w={w} h={h} />

        {/* Idle constellation lines — fade out on selection */}
        <IdleLines w={w} h={h} selectedFontId={state.selectedFontId} />

        {/* Active connection lines (draw-in animation) */}
        {selectedFont && selPx && slots.map((slot, i) => {
          const len = Math.hypot(slot.x - selPx.px, slot.y - selPx.py);
          return (
            <ConnectionLine
              key={`line-${selectedFont.pairings[i].font}`}
              ref={lineRefs.current[i] as React.RefObject<SVGLineElement>}
              x1={selPx.px} y1={selPx.py}
              x2={slot.x} y2={slot.y}
              length={len}
            />
          );
        })}

        {/* Base font nodes */}
        <g style={{ color: '#f0ede8' }}>
          {BASE_FONTS.map(font => {
            const { px, py } = fontPx(font.id, font.position.x, font.position.y, w, h);
            const isSelected = state.selectedFontId === font.id;
            const isDeselected = !!state.selectedFontId && !isSelected;
            return (
              <FontNode
                key={font.id}
                ref={setBaseNodeRef(font.id)}
                font={font}
                x={px}
                y={py}
                isSelected={isSelected}
                isDeselected={isDeselected}
                onClick={handleFontClick}
              />
            );
          })}
        </g>

        {/* Pairing nodes — rendered at 0,0; GSAP moves them to slots */}
        {selectedFont && selectedFont.pairings.map((pairing, i) => (
          <PairingNode
            key={`pair-${pairing.font}`}
            ref={pairingNodeRefs.current[i] as React.RefObject<SVGGElement>}
            pairing={pairing}
            lineRef={lineRefs.current[i] as React.RefObject<SVGLineElement | null>}
            onHover={onHoverNode}
            onCardShow={handleCardShow}
          />
        ))}
      </svg>

      {card && (
        <HoverCard
          pairing={card.pairing}
          x={card.x}
          y={card.y}
          activeContext={state.activeContext}
          onClose={() => setCard(null)}
        />
      )}

      {selectedFont && (
        <ContextFilter activeContext={state.activeContext} onSetContext={onSetContext} />
      )}
    </>
  );
}

// ── ContextFilter ─────────────────────────────────────────────────────────────
const ALL_CONTEXTS: ContextLabel[] = [
  'editorial', 'finance', 'health', 'technology',
  'education', 'branding', 'multilingual',
];
const CONTEXT_LABELS: Record<ContextLabel, string> = {
  editorial: 'Editorial', finance: 'Finance', health: 'Health',
  technology: 'Technology', education: 'Education',
  branding: 'Branding', multilingual: 'Multilingual',
};

function ContextFilter({
  activeContext,
  onSetContext,
}: { activeContext: ContextLabel | null; onSetContext: (c: ContextLabel | null) => void }) {
  const handleClick = (ctx: ContextLabel, el: HTMLButtonElement) => {
    // Chip press animation (§6)
    gsap.fromTo(el,
      { scale: 0.95 },
      { scale: 1, duration: 0.15, ease: 'expo.out' }
    );
    onSetContext(activeContext === ctx ? null : ctx);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 8, zIndex: 10,
    }}>
      {ALL_CONTEXTS.map(ctx => {
        const active = ctx === activeContext;
        return (
          <button
            key={ctx}
            onClick={e => handleClick(ctx, e.currentTarget)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              border: active ? '1px solid #f0ede8' : '1px solid #3a3835',
              background: active ? '#f0ede8' : 'transparent',
              color: active ? '#0a0a0a' : '#a09a95',
              fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase',
            }}
          >
            {CONTEXT_LABELS[ctx]}
          </button>
        );
      })}
    </div>
  );
}
