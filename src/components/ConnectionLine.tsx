import { forwardRef } from 'react';

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number; // pre-computed, needed for dasharray
}

// Purely presentational — all animation driven by GSAP in ConstellationCanvas
// Starts hidden (opacity 0, dashoffset = length). GSAP controls everything.
export const ConnectionLine = forwardRef<SVGLineElement, Props>(
  ({ x1, y1, x2, y2, length }, ref) => (
    <line
      ref={ref}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#f0ede8"
      strokeWidth="0.5"
      strokeDasharray={length}
      strokeDashoffset={length}
      opacity={0}
      style={{ pointerEvents: 'none' }}
    />
  )
);
ConnectionLine.displayName = 'ConnectionLine';
