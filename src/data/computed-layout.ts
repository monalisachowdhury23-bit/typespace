import type { UniverseFont } from './universe';

export interface NodePos { x: number; y: number }

// The space the map is drawn in. On desktop it is the same circle as always.
// On a phone held upright it becomes an oval filling the space between the
// intro at the top and the bottom edge, instead of a circle squeezed to the
// screen width with a third of the screen left empty.
export interface MapArea {
  cx: number; cy: number;   // centre
  rx: number; ry: number;   // radius across and down
  x0: number; x1: number;   // nodes stay inside these bounds
  y0: number; y1: number;
}

export function isTallPhone(vw: number, vh: number): boolean {
  return vw < 600 && vh > vw * 1.2;
}

export function mapArea(vw: number, vh: number, top = 0, bottom = 0): MapArea {
  if (isTallPhone(vw, vh) && top > 0) {
    const y0 = top + 18, y1 = vh - 18 - bottom;
    const rx = vw * 0.47;
    return { cx: vw / 2, cy: (y0 + y1) / 2, rx, ry: Math.max(rx, (y1 - y0) / 2), x0: 0.05 * vw, x1: 0.95 * vw, y0, y1 };
  }
  const R = Math.min(vw * 0.46, vh * 0.47);
  return { cx: vw / 2, cy: vh / 2, rx: R, ry: R, x0: 0.05 * vw, x1: 0.95 * vw, y0: 0.05 * vh, y1: 0.95 * vh };
}

// ── FNV-1a 32-bit hash → two normalised [0,1) values ────────────────────────
function fnv1a(str: string): [number, number] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const h2 = Math.imul(h, 0x9e3779b9) >>> 0;
  return [h % 997 / 997, h2 % 997 / 997];
}

function norm(v: number): number { return v * 2 - 1; } // [0,1) → [-1,1)

// Estimated render width for an 'Aa' glyph node
function approxWidth(font: UniverseFont): number {
  // Matches GLYPH_SIZE in SpatialMap: 24 / 16 / 11
  const size = font.tier === 1 ? 24 : font.tier === 2 ? 16 : 11;
  return size * 1.5; // 'Aa' is two chars ≈ 1.5 em wide
}

// Ring assignment by displayAffinity (0 = innermost/expressive, 4 = outermost/workhorse)
function getRingIdx(da: number): number {
  if (da >= 8) return 0;
  if (da >= 6) return 1;
  if (da >= 4) return 2;
  if (da >= 2) return 3;
  return 4;
}

// ── Main position computation ─────────────────────────────────────────────────
export function computePositions(
  fonts: readonly UniverseFont[],
  vw: number,
  vh: number,
  area: MapArea = mapArea(vw, vh),
): Map<string, NodePos> {

  // ── Step 1: concentric rings by displayAffinity, angle by humanistGeometric ──
  //
  // Ring  0 (innermost): displayAffinity ≥ 8  — expressive display faces crown the top
  // Ring  1:             displayAffinity ≥ 6
  // Ring  2:             displayAffinity ≥ 4
  // Ring  3:             displayAffinity ≥ 2
  // Ring  4 (outermost): displayAffinity < 2   — pure text workhorses
  //
  // Within each ring, fonts are rank-sorted by humanistGeometric and assigned
  // angles spanning the TOP-HALF arch: π (left/humanist) → 0 (right/geometric).
  // The bottom half becomes negative space — inner display fonts crown the top,
  // outer body-text fonts form a wider arch below, creating a horseshoe silhouette.
  //
  const semantic = new Map<string, NodePos>();
  const pos      = new Map<string, NodePos>();

  const { cx: CX, cy: CY, rx: RX, ry: RY } = area;     // ring centre and radii

  const RING_FRAC = [0.18, 0.36, 0.54, 0.72, 0.90];     // fraction of R per ring

  // Each ring starts at a different angle so they don't all "open" at the same spot
  const RING_START = [
    Math.PI,          // ring 0: innermost, starts left
    Math.PI / 3,      // ring 1: starts upper-right
    Math.PI * 2 / 3,  // ring 2: starts upper-left
    Math.PI * 4 / 3,  // ring 3: starts lower-left
    Math.PI * 5 / 3,  // ring 4: outermost, starts lower-right
  ];

  // Group fonts by ring, sort by hg within each ring
  const ringGroups = new Map<number, UniverseFont[]>();
  for (const font of fonts) {
    const r = getRingIdx(font.displayAffinity);
    if (!ringGroups.has(r)) ringGroups.set(r, []);
    ringGroups.get(r)!.push(font);
  }
  for (const [, members] of ringGroups) {
    members.sort((a, b) => a.humanistGeometric - b.humanistGeometric);
  }

  // Even spacing around full 360°: i/members.length gives [0, 1) — open interval avoids
  // wrap collision (rank 0 and rank ~1 are adjacent, not overlapping).
  // Sorting by hg means adjacent fonts on the ring are semantically related (humanist–geometric
  // transition is readable by tracing around the circle).
  const hgInRing = new Map<string, number>();
  for (const [, members] of ringGroups) {
    members.forEach((f, i) =>
      hgInRing.set(f.id, i / members.length));
  }

  for (const font of fonts) {
    const [jxN, jyN] = fnv1a(font.id);
    const jx = norm(jxN); // [-1, 1)
    const jy = norm(jyN);

    const ringIdx = getRingIdx(font.displayAffinity);
    const baseR   = RING_FRAC[ringIdx];
    const hgRank  = hgInRing.get(font.id) ?? 0.5;

    // Full 360° ring: each ring starts at its own offset so the "opening" (tiny gap between
    // most-humanist and most-geometric font, which are adjacent) is staggered per ring.
    // Humanist→geometric transition is readable by tracing clockwise around each ring.
    const baseAngle = RING_START[ringIdx] + hgRank * 2 * Math.PI;
    const angle     = baseAngle + jx * 0.10;          // ±0.10 rad angular jitter
    const r         = baseR    + jy * baseR * 0.06;   // ±6% radial jitter

    // Screen coords: Y-axis inverted, so negate sin to put π/2 at the top
    const sx = clamp(CX + Math.cos(baseAngle) * baseR * RX, area.x0, area.x1);
    const sy = clamp(CY - Math.sin(baseAngle) * baseR * RY, area.y0, area.y1);
    const x  = clamp(CX + Math.cos(angle) * r * RX,         area.x0, area.x1);
    const y  = clamp(CY - Math.sin(angle) * r * RY,         area.y0, area.y1);

    semantic.set(font.id, { x: sx, y: sy });
    pos.set(font.id,      { x,    y    });
  }

  // ── Step 2: soft force-directed relaxation with spring restoration ────────
  //
  // Two forces per pair:
  //   • Repulsion  — pushes overlapping nodes apart by OVERLAP * SOFT_K
  //   • Spring     — pulls each node SPRING_K of the way back to its semantic pos
  //
  // Horizontal push is capped at MAX_X_RATIO of the vertical push so fonts
  // cannot slide far enough left/right to leave their humanist/geometric column.
  //
  const ITERATIONS  = 80;
  const SOFT_K      = 0.22;   // fraction of overlap resolved each pass
  const SPRING_K    = 0.03;   // pulls nodes back toward their ring arc positions
  const MAX_X_RATIO = 1.0;    // rings: allow full push in any direction (no axis bias)
  const MIN_V       = 18;     // px — minimum vertical clearance
  const MIN_H_PAD   = 12;     // px — extra horizontal padding beyond half-widths sum

  const arr = [...fonts];

  for (let iter = 0; iter < ITERATIONS; iter++) {

    // Repulsion pass
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const pi = pos.get(arr[i].id)!;
        const pj = pos.get(arr[j].id)!;

        const minH = (approxWidth(arr[i]) + approxWidth(arr[j])) / 2 + MIN_H_PAD;
        const dx = Math.abs(pi.x - pj.x);
        const dy = Math.abs(pi.y - pj.y);

        if (dx < minH && dy < MIN_V) {
          const overlapV = (MIN_V  - dy) * SOFT_K;
          const overlapH = (minH   - dx) * SOFT_K;

          // Prefer vertical resolution (semantic: Y = display axis, coarser)
          if (overlapV <= overlapH) {
            const pushY = overlapV / 2;
            const pushX = Math.min(overlapH / 2, pushY * MAX_X_RATIO);
            applyPush(pi, pj, pushX, pushY);
          } else {
            const pushY = overlapV / 2;
            const pushX = Math.min(overlapH / 2, pushY * MAX_X_RATIO);
            applyPush(pi, pj, pushX, pushY);
          }

          clampPos(pi, pj, area);
        }
      }
    }

    // Spring restoration — pull each node back toward its ring arc position
    for (const font of fonts) {
      const p  = pos.get(font.id)!;
      const s  = semantic.get(font.id)!;
      p.x += (s.x - p.x) * SPRING_K;
      p.y += (s.y - p.y) * SPRING_K;
      p.x = clamp(p.x, area.x0, area.x1);
      p.y = clamp(p.y, area.y0, area.y1);
    }
  }

  return pos;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function applyPush(pi: NodePos, pj: NodePos, pushX: number, pushY: number) {
  if (pi.y <= pj.y) { pi.y -= pushY; pj.y += pushY; }
  else               { pi.y += pushY; pj.y -= pushY; }

  if (pi.x <= pj.x) { pi.x -= pushX; pj.x += pushX; }
  else               { pi.x += pushX; pj.x -= pushX; }
}

function clampPos(pi: NodePos, pj: NodePos, a: MapArea) {
  pi.x = clamp(pi.x, a.x0, a.x1);
  pi.y = clamp(pi.y, a.y0, a.y1);
  pj.x = clamp(pj.x, a.x0, a.x1);
  pj.y = clamp(pj.y, a.y0, a.y1);
}

// ── Orbit ring positions for anchor state (spec §8.3) ────────────────────────
export function orbitPositions(
  anchorPos: NodePos,
  partnerPositions: NodePos[],
  vw: number,
  vh: number,
  area: MapArea = mapArea(vw, vh),
): NodePos[] {
  const { inner: INNER_R, outer: OUTER_R } = orbitRadii(vw, vh, area);
  // On a phone the rings are small, so partners need wider spacing for their
  // names to fit, and they keep a margin wide enough for the name under them.
  const phone = isTallPhone(vw, vh);
  const deg = (d: number) => (d * Math.PI) / 180;
  const xMin = phone ? Math.max(area.x0, 84) : area.x0;
  const xMax = phone ? Math.min(area.x1, vw - 84) : area.x1;

  function toRing(angles: number[], rx: number, ry = rx): NodePos[] {
    return angles.map(ang => ({
      x: clamp(anchorPos.x + Math.cos(ang) * rx, xMin, xMax),
      y: clamp(anchorPos.y + Math.sin(ang) * ry, area.y0, area.y1),
    }));
  }

  const innerAngles = partnerPositions.slice(0, 5).map(p =>
    Math.atan2(p.y - anchorPos.y, p.x - anchorPos.x));
  const outerAngles = partnerPositions.slice(5, 12).map(p =>
    Math.atan2(p.y - anchorPos.y, p.x - anchorPos.x));

  const inner = spreadAngles(innerAngles, deg(phone ? 64 : 24));
  // On a phone the outer ring also keeps clear of the inner partners,
  // otherwise a name on one ring lands on a name on the other.
  // It is also taller than it is wide, and stays out of the sides, where the
  // screen edge would push a name back in on top of an inner one.
  if (!phone) return [...toRing(inner, INNER_R), ...toRing(spreadAngles(outerAngles, deg(24)), OUTER_R)];
  const outerRy = Math.max(OUTER_R, Math.min(OUTER_R * 1.35, (area.y1 - area.y0) / 2 - 34));
  const room = Math.min(1, (xMax - anchorPos.x) / OUTER_R);
  const outer = fitAround(outerAngles, inner, deg(36), deg(46), a => Math.abs(Math.cos(a)) <= room);
  return [...toRing(inner, INNER_R), ...toRing(outer, OUTER_R, outerRy)];
}

// Spread angles so neighbours sit at least minAng apart, keeping their order
// and moving them as little as possible. The sweep starts just after the
// widest gap, so nothing can jump past its neighbour.
function spreadAngles(input: number[], minAng: number): number[] {
  const TAU = Math.PI * 2;
  const n = input.length;
  if (n < 2) return input.slice();
  const m = Math.min(minAng, TAU / n);
  const order = input
    .map((a, i) => [((a % TAU) + TAU) % TAU, i] as [number, number])
    .sort((p, q) => p[0] - q[0]);
  let start = 0, widest = -1;
  for (let k = 0; k < n; k++) {
    const gap = k === 0 ? order[0][0] + TAU - order[n - 1][0] : order[k][0] - order[k - 1][0];
    if (gap > widest) { widest = gap; start = k; }
  }
  const seq = order.map((_, k) => {
    const [a, i] = order[(start + k) % n];
    return [start + k >= n ? a + TAU : a, i] as [number, number];
  });
  const q = seq.map(([a]) => a);
  for (let k = 1; k < n; k++) q[k] = Math.max(q[k], q[k - 1] + m);
  if (q[n - 1] - q[0] > TAU - m) for (let k = 1; k < n; k++) q[k] = q[0] + (k * TAU) / n;
  const shift = q.reduce((sum, v, k) => sum + v - seq[k][0], 0) / n;
  const out = new Array<number>(n);
  seq.forEach(([, i], k) => { out[i] = q[k] - shift; });
  return out;
}

// Place each angle (best partner first) at the free spot closest to where
// it wants to be: at least `clear` from every fixed angle and `gap` from the
// ones already placed. Steps down the spacing if the circle runs out of room.
function fitAround(
  wanted: number[], fixed: number[], clear: number, gap: number,
  allowed: (a: number) => boolean = () => true,
): number[] {
  const TAU = Math.PI * 2;
  const dist = (a: number, b: number) => {
    const d = Math.abs((((a - b) % TAU) + TAU) % TAU);
    return Math.min(d, TAU - d);
  };
  const placed: number[] = [];
  for (const want of wanted) {
    let best: number | null = null;
    for (let scale = 1; best === null && scale > 0.2; scale -= 0.2) {
      let bestD = Infinity;
      for (let step = 0; step < 360; step++) {
        const a = want + ((step % 2 ? 1 : -1) * Math.ceil(step / 2) * Math.PI) / 180;
        if (scale > 0.5 && !allowed(a)) continue;
        if (fixed.some(f => dist(a, f) < clear * scale)) continue;
        if (placed.some(p => dist(a, p) < gap * scale)) continue;
        const d = dist(a, want);
        if (d < bestD) { bestD = d; best = a; break; }
      }
    }
    placed.push(best ?? want);
  }
  return placed;
}

// Orbit radii scale with the viewport so partners stay on screen on phones.
export function orbitRadii(vw: number, vh: number, area?: MapArea): { inner: number; outer: number } {
  // On a phone the partners have to fit between the intro and the bottom bar
  const m = area && isTallPhone(vw, vh) ? Math.min(vw, area.y1 - area.y0) : Math.min(vw, vh);
  if (m < 600) return { inner: m * 0.3, outer: m * 0.45 };
  return { inner: Math.min(230, m * 0.27), outer: Math.min(340, m * 0.41) };
}

// ── Periphery push (spec §8.3) ────────────────────────────────────────────────
// Faded fonts move out past the outer orbit so nothing crowds the anchor or
// its partners. Direction is kept, so the map still reads as the same map.
export function peripheryPos(
  current: NodePos,
  anchor: NodePos,
  vw: number,
  vh: number,
  area: MapArea = mapArea(vw, vh),
): NodePos {
  const dx = current.x - anchor.x;
  const dy = current.y - anchor.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const { outer } = orbitRadii(vw, vh, area);
  // Room available in this direction before the screen edge (24px margin)
  const edge = Math.min(
    Math.abs(ux) > 1e-3 ? ((ux > 0 ? vw - anchor.x : anchor.x) - 24) / Math.abs(ux) : Infinity,
    Math.abs(uy) > 1e-3 ? ((uy > 0 ? vh - anchor.y : anchor.y) - 24) / Math.abs(uy) : Infinity,
  );
  const inner = Math.min(outer + 44, edge);
  const maxDist = Math.max(area.rx, area.ry);
  const t = Math.min(1, dist / maxDist);
  const target = inner + t * Math.max(0, edge - inner);
  return { x: anchor.x + ux * target, y: anchor.y + uy * target };
}
