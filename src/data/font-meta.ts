// Per-font metadata needed by Lab — additive, never modifying fonts.ts
// signatureGlyph: most characteristic letter for 38vh anchor background
// displayAffinity: 0-10, higher = more opinionated/display-forward (for sans/sans role assignment)
// visualWeight: 0-10, drives ambient drift speed (higher = slower, like physical mass)

export interface FontMeta {
  signatureGlyph: string;
  displayAffinity: number; // 0–10
  visualWeight: number;    // 0–10 (Baloo 2 = 9, Cormorant = 3)
}

export const FONT_META: Record<string, FontMeta> = {
  // Serifs
  'instrument-serif':   { signatureGlyph: 'R', displayAffinity: 6, visualWeight: 5 },
  'fraunces':           { signatureGlyph: 'g', displayAffinity: 8, visualWeight: 6 },
  'playfair-display':   { signatureGlyph: 'Q', displayAffinity: 9, visualWeight: 6 },
  'cormorant-garamond': { signatureGlyph: 'C', displayAffinity: 7, visualWeight: 3 },
  'dm-serif-display':   { signatureGlyph: 'D', displayAffinity: 8, visualWeight: 5 },
  'libre-baskerville':  { signatureGlyph: 'e', displayAffinity: 5, visualWeight: 6 },

  // Sans-serifs
  'dm-sans':            { signatureGlyph: 'a', displayAffinity: 3, visualWeight: 4 },
  'space-grotesk':      { signatureGlyph: 'G', displayAffinity: 6, visualWeight: 5 },
  'plus-jakarta-sans':  { signatureGlyph: 'J', displayAffinity: 4, visualWeight: 5 },
  'epilogue':           { signatureGlyph: 'E', displayAffinity: 5, visualWeight: 4 },
  'sora':               { signatureGlyph: 'S', displayAffinity: 4, visualWeight: 4 },
  'lexend':             { signatureGlyph: 'L', displayAffinity: 2, visualWeight: 4 },
  'chivo':              { signatureGlyph: 'C', displayAffinity: 4, visualWeight: 5 },
  'outfit':             { signatureGlyph: 'O', displayAffinity: 3, visualWeight: 4 },

  // Fontshare grotesques
  'satoshi':            { signatureGlyph: 'a', displayAffinity: 5, visualWeight: 5 },
  'cabinet-grotesk':    { signatureGlyph: 'G', displayAffinity: 7, visualWeight: 6 },
  'general-sans':       { signatureGlyph: 'g', displayAffinity: 3, visualWeight: 4 },
  'switzer':            { signatureGlyph: 'R', displayAffinity: 4, visualWeight: 4 },

  // Display / expressive
  'clash-display':      { signatureGlyph: 'C', displayAffinity: 10, visualWeight: 7 },
  'bricolage-grotesque':{ signatureGlyph: 'B', displayAffinity: 9,  visualWeight: 7 },

  // Indic-origin dual-script
  'eczar':              { signatureGlyph: 'क', displayAffinity: 7,  visualWeight: 5 },
  'mukta':              { signatureGlyph: 'म', displayAffinity: 4,  visualWeight: 6 },
  'hind':               { signatureGlyph: 'ह', displayAffinity: 3,  visualWeight: 5 },
  'baloo-2':            { signatureGlyph: 'ब', displayAffinity: 6,  visualWeight: 9 },
  'noto-sans':          { signatureGlyph: 'न', displayAffinity: 2,  visualWeight: 5 },
};

export const INDIC_FONT_IDS = new Set([
  'eczar', 'mukta', 'hind', 'baloo-2', 'noto-sans',
]);

/** Determine which font takes display role, which takes text role */
export function assignRoles(
  fontAId: string, fontACategory: string,
  fontBId: string, fontBCategory: string,
): { displayId: string; textId: string } {
  const metaA = FONT_META[fontAId];
  const metaB = FONT_META[fontBId];

  // Rule 1: serif beats sans for display
  if (fontACategory === 'serif' && fontBCategory !== 'serif') return { displayId: fontAId, textId: fontBId };
  if (fontBCategory === 'serif' && fontACategory !== 'serif') return { displayId: fontBId, textId: fontAId };

  // Rule 2+3: higher displayAffinity wins
  if (Math.abs((metaA?.displayAffinity ?? 5) - (metaB?.displayAffinity ?? 5)) > 1) {
    return (metaA?.displayAffinity ?? 5) >= (metaB?.displayAffinity ?? 5)
      ? { displayId: fontAId, textId: fontBId }
      : { displayId: fontBId, textId: fontAId };
  }

  // Tie (within 1) — caller should show swap toggle; default to A
  return { displayId: fontAId, textId: fontBId };
}
