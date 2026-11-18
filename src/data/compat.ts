import type { UniverseFont, FontCategory } from './universe';

// ── Compat algorithm (spec §7.4) ─────────────────────────────────────────────

function complements(a: FontCategory, b: FontCategory): boolean {
  if (a === b) return false;
  const has = (c: FontCategory) => a === c || b === c;
  if (has('serif') && has('sans-serif')) return true;
  if (has('display') && (has('sans-serif') || has('serif'))) return true;
  if (has('monospace') && (has('sans-serif') || has('serif'))) return true;
  return false;
}

export function compat(a: UniverseFont, b: UniverseFont): number {
  const dAff = Math.abs(a.displayAffinity - b.displayAffinity);
  const dHG  = Math.abs(a.humanistGeometric - b.humanistGeometric);
  const dVW  = Math.abs(a.visualWeight - b.visualWeight);
  let s = 0;

  // Role separation — sweet spot 3–6 apart on display axis
  s += 3.0 * Math.exp(-((dAff - 4.5) ** 2) / (2 * 1.8 ** 2));

  // Category complement / redundancy
  if (complements(a.category, b.category)) s += 2.5;
  if (a.category === b.category && dAff < 2) s -= 2.0;

  // Kinship or deliberate contrast — never mushy middle
  if      (dHG <= 0.4) s += 1.5 * (1 - dHG / 0.4);
  else if (dHG >= 1.0) s += 1.5 * Math.min((dHG - 1.0) / 0.6, 1);

  // Script bridge bonus
  if (a.indic && b.indic) s += 1.25;

  // Weight rhythm
  if (dVW >= 2) s += 0.5;

  return s;
}

// ── Per-font top-8 compatible partners ───────────────────────────────────────

export interface CompatPartner {
  id: string;
  score: number;
}

// Lazy singleton — computed once, cached forever
let _cache: Map<string, CompatPartner[]> | null = null;

export function getCompatMap(fonts: readonly UniverseFont[]): Map<string, CompatPartner[]> {
  if (_cache) return _cache;

  _cache = new Map<string, CompatPartner[]>();
  for (const a of fonts) {
    const scores: CompatPartner[] = [];
    for (const b of fonts) {
      if (a.id === b.id) continue;
      scores.push({ id: b.id, score: compat(a, b) });
    }
    scores.sort((x, y) => y.score - x.score);
    _cache.set(a.id, scores.slice(0, 8));
  }
  return _cache;
}

// ── Relationship type → color token (spec §7.3) ───────────────────────────────

export type RelType = 'kinship' | 'contrast';

// Colour says how the two skeletons relate. Whether both fonts carry
// Devanagari is a separate fact, shown as a dashed line (see bothDevanagari).
export function relType(a: UniverseFont, b: UniverseFont): RelType {
  const dHG = Math.abs(a.humanistGeometric - b.humanistGeometric);
  return dHG <= 0.5 ? 'kinship' : 'contrast';
}

export function bothDevanagari(a: UniverseFont, b: UniverseFont): boolean {
  return a.indic && b.indic;
}

export const REL_COLORS: Record<RelType, string> = {
  kinship:  '#8FB0CE',
  contrast: '#D9A05B',
};

// ── Annotation copy (spec §7.5) ───────────────────────────────────────────────

export function annotationCopy(a: UniverseFont, b: UniverseFont): string {
  const dAff = Math.abs(a.displayAffinity - b.displayAffinity);
  const dVW  = Math.abs(a.visualWeight - b.visualWeight);

  const role = dAff >= 3 ? 'display over text' : 'peer roles';

  let structure: string;
  if (relType(a, b) === 'kinship') {
    const bothHumanist = a.humanistGeometric < 0 && b.humanistGeometric < 0;
    structure = bothHumanist ? 'both drawn' : 'both constructed';
  } else {
    structure = 'drawn against constructed';
  }

  const parts: string[] = [role, structure];
  if (dVW >= 3) parts.push('contrasting weight rhythm');
  if (bothDevanagari(a, b)) parts.push('both have Devanagari');

  return parts.join(' · ');
}

// ── Rationale footer sentence (spec §10.4) ─────────────────────────────────────

export function rationaleSentence(display: UniverseFont, text: UniverseFont): string {
  const dHG  = Math.abs(display.humanistGeometric - text.humanistGeometric);
  const dAff = Math.abs(display.displayAffinity - text.displayAffinity);
  const melody = dHG >= 1.0 ? 'argument' : 'melody';
  const roles  = dAff >= 3  ? 'a clean split of roles' : 'two peers taking turns';
  const struct = annotationCopy(display, text).split(' · ')[1] ?? '';
  const lead = struct ? struct.charAt(0).toUpperCase() + struct.slice(1) : '';
  return `${display.name} carries the ${melody}; ${text.name} carries the reader. ${lead}, ${roles}.`;
}

// ── Quadratic bezier control point + SVG path (spec §7.1) ─────────────────────

export function bezierPath(
  x1: number, y1: number,
  x2: number, y2: number,
  normalizedCompat: number, // [0,1] within top-5 set
): string {
  const chordLen = Math.hypot(x2 - x1, y2 - y1);
  const sag = chordLen * 0.18 * (1 - normalizedCompat);

  // Mid-chord point
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Perpendicular offset (downward)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular: rotate 90° clockwise = (dy/len, -dx/len), bias downward (+y)
  const perpX =  dy / len;
  const perpY = -dx / len;
  const biasedPerpY = perpY + 0.5; // bias toward +y (downward)

  const cpx = mx + perpX * sag;
  const cpy = my + biasedPerpY * sag;

  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

// ── Midpoint of quadratic bezier at t=0.5 ────────────────────────────────────

export function bezierMidpoint(
  x1: number, y1: number,
  x2: number, y2: number,
  normalizedCompat: number,
): { x: number; y: number } {
  const chordLen = Math.hypot(x2 - x1, y2 - y1);
  const sag = chordLen * 0.18 * (1 - normalizedCompat);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const perpX =  dy / len;
  const perpY = -dx / len;
  const biasedPerpY = perpY + 0.5;
  const cpx = mx + perpX * sag;
  const cpy = my + biasedPerpY * sag;
  // B(0.5) for quadratic: 0.25*P0 + 0.5*CP + 0.25*P2
  return {
    x: 0.25 * x1 + 0.5 * cpx + 0.25 * x2,
    y: 0.25 * y1 + 0.5 * cpy + 0.25 * y2,
  };
}
