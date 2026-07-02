import { forwardRef } from 'react';
import type { BaseFont } from '../types';
import { animateBaseHoverIn, animateBaseHoverOut } from '../animations/expand';

interface FontNodeProps {
  font: BaseFont;
  isSelected: boolean;
  isDeselected: boolean;
  onClick: (id: string) => void;
}

// Outer <g> holds x/y translation (never animated).
// Inner <g> (ref) is what GSAP scales — avoids transform conflict.
export const FontNode = forwardRef<SVGGElement, FontNodeProps & { x: number; y: number }>(
  ({ font, x, y, isSelected, isDeselected, onClick }, ref) => {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <g
          ref={ref}
          onClick={() => onClick(font.id)}
          onMouseEnter={e => !isDeselected && animateBaseHoverIn(e.currentTarget)}
          onMouseLeave={e => animateBaseHoverOut(e.currentTarget)}
          role="button"
          aria-label={`Select ${font.name}`}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onClick(font.id)}
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          {/* Glow ring — visible when selected */}
          {isSelected && (
            <circle r="18" fill="none" stroke="#f0ede8" strokeWidth="0.4" opacity={0.15} />
          )}
          {/* Star dot */}
          <circle
            r={isSelected ? 4 : 3}
            fill={isSelected ? '#f0ede8' : '#8a8480'}
            style={{ transition: 'r 0.3s ease, fill 0.3s ease' }}
          />
          {/* Font name */}
          <text
            y={-14}
            fontFamily={`'${font.name}', serif`}
            fontSize={isSelected ? 15 : 13}
            fill="#f0ede8"
            textAnchor="middle"
            opacity={isDeselected ? 0.22 : 1}
            style={{
              userSelect: 'none',
              transition: 'opacity 0.35s ease, font-size 0.3s ease',
            }}
          >
            {font.name}
          </text>
          {/* Specimen — only at rest, very subtle */}
          {!isSelected && (
            <text
              y={8}
              fontFamily={`'${font.name}', serif`}
              fontSize="8"
              fill="#f0ede8"
              textAnchor="middle"
              opacity={isDeselected ? 0.04 : 0.25}
              style={{ userSelect: 'none', letterSpacing: '0.03em', transition: 'opacity 0.35s ease' }}
            >
              {font.specimen}
            </text>
          )}
        </g>
      </g>
    );
  }
);
FontNode.displayName = 'FontNode';
