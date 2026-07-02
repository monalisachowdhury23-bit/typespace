import { useMemo } from 'react';
import { BASE_FONTS } from '../data/fonts';
import { LAYOUT } from '../data/layout';

// Ultra-faint lines connecting each font to its top 2 pairings.
// Visible at rest — sells the constellation metaphor before click.
// Opacity 0.04 so they read as atmosphere, not content.

interface Props {
  w: number;
  h: number;
  selectedFontId: string | null;
}

export function IdleLines({ w, h, selectedFontId }: Props) {
  const lines = useMemo(() => {
    const seen = new Set<string>();
    const result: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];

    BASE_FONTS.forEach(font => {
      const aPos = LAYOUT[font.id] ?? font.position;
      font.pairings.forEach(pairing => {
        const targetFont = BASE_FONTS.find(f => f.name === pairing.font);
        if (!targetFont) return;
        const key = [font.id, targetFont.id].sort().join('--');
        if (seen.has(key)) return;
        seen.add(key);
        const bPos = LAYOUT[targetFont.id] ?? targetFont.position;
        result.push({
          x1: (aPos.x / 100) * w,
          y1: (aPos.y / 100) * h,
          x2: (bPos.x / 100) * w,
          y2: (bPos.y / 100) * h,
          key,
        });
      });
    });

    return result;
  }, [w, h]);

  // Fade out when a font is selected (active pairing lines take over)
  const opacity = selectedFontId ? 0 : 1;

  return (
    <g
      aria-hidden="true"
      pointerEvents="none"
      style={{ transition: 'opacity 0.4s ease', opacity }}
    >
      {lines.map(l => (
        <line
          key={l.key}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="#f0ede8"
          strokeWidth="0.4"
          opacity={0.06}
        />
      ))}
    </g>
  );
}
