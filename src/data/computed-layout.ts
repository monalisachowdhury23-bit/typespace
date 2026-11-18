import type { UniverseFont } from './universe';

export interface NodePos { x: number; y: number }

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

  const CX = vw * 0.5;                                    // ring centre
  const CY = vh * 0.5;
  const R  = Math.min(vw * 0.46, vh * 0.47);             // fills screen in both axes

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
    const baseR   = R * RING_FRAC[ringIdx];
    const hgRank  = hgInRing.get(font.id) ?? 0.5;

    // Full 360° ring: each ring starts at its own offset so the "opening" (tiny gap between
    // most-humanist and most-geometric font, which are adjacent) is staggered per ring.
    // Humanist→geometric transition is readable by tracing clockwise around each ring.
    const baseAngle = RING_START[ringIdx] + hgRank * 2 * Math.PI;
    const angle     = baseAngle + jx * 0.10;          // ±0.10 rad angular jitter
    const r         = baseR    + jy * baseR * 0.06;   // ±6% radial jitter

    // Screen coords: Y-axis inverted, so negate sin to put π/2 at the top
    const sx = clamp(CX + Math.cos(baseAngle) * baseR, 0.05 * vw, 0.95 * vw);
    const sy = clamp(CY - Math.sin(baseAngle) * baseR, 0.05 * vh, 0.95 * vh);
    const x  = clamp(CX + Math.cos(angle) * r,         0.05 * vw, 0.95 * vw);
    const y  = clamp(CY - Math.sin(angle) * r,         0.05 * vh, 0.95 * vh);

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

          clampPos(pi, pj, vw, vh);
        }
      }
    }

    // Spring restoration — pull each node back toward its ring arc position
    for (const font of fonts) {
      const p  = pos.get(font.id)!;
      const s  = semantic.get(font.id)!;
      p.x += (s.x - p.x) * SPRING_K;
      p.y += (s.y - p.y) * SPRING_K;
      p.x = clamp(p.x, 0.05 * vw, 0.95 * vw);
      p.y = clamp(p.y, 0.05 * vh, 0.95 * vh);
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

function clampPos(pi: NodePos, pj: NodePos, vw: number, vh: number) {
  pi.x = clamp(pi.x, 0.05 * vw, 0.95 * vw);
  pi.y = clamp(pi.y, 0.05 * vh, 0.95 * vh);
  pj.x = clamp(pj.x, 0.05 * vw, 0.95 * vw);
  pj.y = clamp(pj.y, 0.05 * vh, 0.95 * vh);
}

// ── Orbit ring positions for anchor state (spec §8.3) ────────────────────────
export function orbitPositions(
  anchorPos: NodePos,
  partnerPositions: NodePos[],
  vw: number,
  vh: number,
): NodePos[] {
  const { inner: INNER_R, outer: OUTER_R } = orbitRadii(vw, vh);
  const MIN_ANG = (24 * Math.PI) / 180;

  function placeRing(semanticAngles: number[], radius: number): NodePos[] {
    const sorted = [...semanticAngles.entries()].sort((a, b) => a[1] - b[1]);
    const angles = sorted.map(([, ang]) => ang);

    for (let pass = 0; pass < 16; pass++) {
      for (let i = 0; i < angles.length; i++) {
        const next = (i + 1) % angles.length;
        let diff = angles[next] - angles[i];
        while (diff < 0) diff += 2 * Math.PI;
        if (diff < MIN_ANG) {
          const push = (MIN_ANG - diff) / 2;
          angles[i] -= push;
          angles[next] += push;
        }
      }
    }

    const result: NodePos[] = new Array(semanticAngles.length);
    sorted.forEach(([origIdx], sortedIdx) => {
      const ang = angles[sortedIdx];
      result[origIdx] = {
        x: clamp(anchorPos.x + Math.cos(ang) * radius, 0.05 * vw, 0.95 * vw),
        y: clamp(anchorPos.y + Math.sin(ang) * radius, 0.05 * vh, 0.95 * vh),
      };
    });
    return result;
  }

  const innerAngles = partnerPositions.slice(0, 5).map(p =>
    Math.atan2(p.y - anchorPos.y, p.x - anchorPos.x));
  const outerAngles = partnerPositions.slice(5, 12).map(p =>
    Math.atan2(p.y - anchorPos.y, p.x - anchorPos.x));

  return [...placeRing(innerAngles, INNER_R), ...placeRing(outerAngles, OUTER_R)];
}

// Orbit radii scale with the viewport so partners stay on screen on phones.
export function orbitRadii(vw: number, vh: number): { inner: number; outer: number } {
  const m = Math.min(vw, vh);
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
): NodePos {
  const dx = current.x - anchor.x;
  const dy = current.y - anchor.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const { outer } = orbitRadii(vw, vh);
  // Room available in this direction before the screen edge (24px margin)
  const edge = Math.min(
    Math.abs(ux) > 1e-3 ? (vw / 2 - 24) / Math.abs(ux) : Infinity,
    Math.abs(uy) > 1e-3 ? (vh / 2 - 24) / Math.abs(uy) : Infinity,
  );
  const inner = Math.min(outer + 44, edge);
  const maxDist = Math.min(vw * 0.46, vh * 0.47);
  const t = Math.min(1, dist / maxDist);
  const target = inner + t * Math.max(0, edge - inner);
  return { x: anchor.x + ux * target, y: anchor.y + uy * target };
}
