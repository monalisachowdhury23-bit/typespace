import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Pairing, ContextLabel } from '../types';

interface Props {
  pairing: Pairing;
  x: number;
  y: number;
  activeContext: ContextLabel | null;
  onClose: () => void;
}

const CONTEXT_COLORS: Record<ContextLabel, string> = {
  editorial:    '#c9a96e',
  finance:      '#6ea3c9',
  health:       '#8ec96e',
  technology:   '#9e6ec9',
  education:    '#c96e8e',
  branding:     '#c9c36e',
  multilingual: '#6ec9b8',
};

export function HoverCard({ pairing, x, y, activeContext, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Animate in on mount
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 8, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
    );
  }, [pairing.font]); // re-animate when pairing changes

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Smart positioning — keep card in viewport
  const CARD_W = 280;
  const CARD_H = 180;
  const margin = 16;
  const left = Math.min(Math.max(x - CARD_W / 2, margin), window.innerWidth - CARD_W - margin);
  const top  = y < window.innerHeight / 2
    ? y + 24
    : y - CARD_H - 24;

  return (
    <div
      ref={ref}
      role="tooltip"
      aria-label={`${pairing.font} pairing details`}
      style={{
        position: 'fixed',
        left,
        top,
        width: CARD_W,
        background: '#141412',
        border: '1px solid #2a2826',
        borderRadius: 10,
        padding: '16px 18px',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {/* Font name */}
      <p
        style={{
          fontFamily: `'${pairing.font}', sans-serif`,
          fontSize: 22,
          color: '#f0ede8',
          margin: '0 0 4px',
          lineHeight: 1.2,
        }}
      >
        {pairing.font}
      </p>

      {/* Specimen sentence */}
      <p
        style={{
          fontFamily: `'${pairing.font}', sans-serif`,
          fontSize: 12,
          color: '#7a7470',
          margin: '0 0 12px',
          lineHeight: 1.5,
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </p>

      {/* Rationale */}
      <p
        style={{
          fontSize: 11,
          color: '#9a9490',
          margin: '0 0 12px',
          lineHeight: 1.6,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {pairing.rationale.length > 140
          ? pairing.rationale.slice(0, 137) + '…'
          : pairing.rationale}
      </p>

      {/* Context tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pairing.contexts.map(ctx => {
          const isActive = ctx === activeContext;
          const color = CONTEXT_COLORS[ctx];
          return (
            <span
              key={ctx}
              style={{
                fontSize: 10,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 12,
                border: `1px solid ${color}`,
                color: isActive ? '#0a0a0a' : color,
                background: isActive ? color : 'transparent',
                opacity: isActive ? 1 : 0.7,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {ctx}
            </span>
          );
        })}
      </div>
    </div>
  );
}
