// Semantic spatial layout — compressed into center 65% of viewport
// Formula: actualPct = 17.5 + rawPct * 0.65
// Raw positions designed as a galaxy:
//   Top arc:     Serifs
//   Center mass: Workhorse grotesques
//   Right arm:   Fontshare grotesques
//   Scattered:   Display, Indic-origin

function compress(x: number, y: number) {
  return { x: 17.5 + x * 0.65, y: 12 + y * 0.72 };
}

const RAW: Record<string, { x: number; y: number }> = {
  // ── Serifs (top arc) ──
  'instrument-serif':   { x: 8,  y: 8  },
  'fraunces':           { x: 20, y: 3  },
  'playfair-display':   { x: 34, y: 10 },
  'cormorant-garamond': { x: 48, y: 4  },
  'dm-serif-display':   { x: 62, y: 11 },
  'libre-baskerville':  { x: 78, y: 5  },

  // ── Center grotesque mass ──
  'dm-sans':            { x: 36, y: 40 },
  'space-grotesk':      { x: 50, y: 48 },
  'plus-jakarta-sans':  { x: 38, y: 57 },
  'epilogue':           { x: 24, y: 46 },
  'sora':               { x: 14, y: 33 },
  'lexend':             { x: 22, y: 62 },
  'chivo':              { x: 58, y: 56 },

  // ── Fontshare right arm ──
  'satoshi':            { x: 74, y: 44 },
  'cabinet-grotesk':    { x: 83, y: 32 },
  'general-sans':       { x: 90, y: 50 },
  'switzer':            { x: 80, y: 60 },

  // ── Display / expressive ──
  'clash-display':      { x: 68, y: 22 },
  'bricolage-grotesque':{ x: 54, y: 27 },
  'outfit':             { x: 66, y: 68 },

  // ── Indic-origin — distributed ──
  'eczar':              { x: 10, y: 75 },
  'mukta':              { x: 42, y: 76 },
  'hind':               { x: 28, y: 83 },
  'baloo-2':            { x: 56, y: 80 },
  'noto-sans':          { x: 74, y: 76 },
};

export const LAYOUT: Record<string, { x: number; y: number }> = Object.fromEntries(
  Object.entries(RAW).map(([id, pos]) => [id, compress(pos.x, pos.y)])
);
