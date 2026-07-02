import { forwardRef } from 'react';
import type { Pairing } from '../types';
import { animatePairingHoverIn, animatePairingHoverOut } from '../animations/expand';

interface Props {
  pairing: Pairing;
  lineRef?: React.RefObject<SVGLineElement | null>;
  onHover: (font: string | null) => void;
  onCardShow: (pairing: Pairing, el: SVGGElement) => void;
}

// Starts at opacity 0, position 0,0. GSAP handles all movement + fade-in.
// Inner <g> ref = what GSAP animates (avoids transform conflict).
export const PairingNode = forwardRef<SVGGElement, Props>(
  ({ pairing, lineRef, onHover, onCardShow }, ref) => {
    return (
      <g ref={ref} opacity={0} style={{ cursor: 'pointer', outline: 'none' }}>
        <g
          role="button"
          aria-label={`Pairing: ${pairing.font}`}
          tabIndex={0}
          onMouseEnter={e => {
            onHover(pairing.font);
            animatePairingHoverIn(e.currentTarget.closest('g') as SVGGElement, lineRef?.current ?? null);
            onCardShow(pairing, e.currentTarget.closest('g') as SVGGElement);
          }}
          onMouseLeave={e => {
            onHover(null);
            animatePairingHoverOut(e.currentTarget.closest('g') as SVGGElement, lineRef?.current ?? null);
          }}
        >
          {/* Larger click target */}
          <circle r="14" fill="transparent" />
          {/* Dot */}
          <circle r="2.5" fill="#6b6660" />
          {/* Label */}
          <text
            y={-12}
            fontFamily={`'${pairing.font}', sans-serif`}
            fontSize="10"
            fill="#f0ede8"
            textAnchor="middle"
            opacity={0.7}
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {pairing.font}
          </text>
        </g>
      </g>
    );
  }
);
PairingNode.displayName = 'PairingNode';
