import gsap from 'gsap';

// ─── ANIMATION SPEC — implemented from Fable's choreography doc ───────────────
// Source: /Project/animation-spec.md
// Two curves only:
//   expo.out  — anything arriving
//   power2.inOut — transitions / relocations
// One exception: back.out(1.4) on pairing-node bloom. No elastic, no bounce.
// ─────────────────────────────────────────────────────────────────────────────

/** Kill any running expand/collapse timeline and return a fresh one */
export function createTimeline() {
  return gsap.timeline({ paused: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPAND (§3) — hero moment
// Beat 1: world recedes (0 → 0.4s)
// Beat 2: selected node asserts (0.1 → 0.5s, overlapping)
// Beat 3: pairings bloom outward from base node (0.35 → ~1.15s)
// Lines lead nodes by 0.08s (see §4)
// ─────────────────────────────────────────────────────────────────────────────

interface ExpandArgs {
  otherNodes: SVGGElement[];
  selectedNode: SVGGElement;
  pairingNodes: SVGGElement[];
  lineEls: SVGLineElement[];
  lineLengths: number[];
  baseX: number;
  baseY: number;
  slotPositions: { x: number; y: number }[];
}

export function buildExpandTimeline({
  otherNodes,
  selectedNode,
  pairingNodes,
  lineEls,
  lineLengths,
  baseX,
  baseY,
  slotPositions,
}: ExpandArgs) {
  const tl = createTimeline();

  // Beat 1 — world recedes
  if (otherNodes.length) {
    tl.to(otherNodes, {
      opacity: 0.15,
      scale: 0.9,
      svgOrigin: 'center center',
      duration: 0.4,
      ease: 'power2.inOut',
    }, 0);
  }

  // Beat 2 — selected asserts
  tl.to(selectedNode, {
    scale: 1.3,
    svgOrigin: 'center center',
    duration: 0.5,
    ease: 'expo.out',
  }, 0.1);

  // Lines draw — lead nodes by 0.08s (§4)
  lineEls.forEach((line, i) => {
    const len = lineLengths[i];
    const nodeDelay = 0.35 + i * 0.06;
    const lineDelay = nodeDelay - 0.08;

    tl.fromTo(line,
      { strokeDashoffset: len, opacity: 0 },
      {
        strokeDashoffset: 0,
        opacity: 0.5,
        duration: 0.45,
        ease: 'power2.out',
        onComplete() {
          // Settle to resting opacity after node lands
          gsap.to(line, { opacity: 0.35, duration: 0.2, ease: 'power2.inOut' });
        },
      },
      lineDelay,
    );
  });

  // Beat 3 — pairings bloom outward from base node (§3)
  pairingNodes.forEach((node, i) => {
    const slot = slotPositions[i];
    const delay = 0.35 + i * 0.06;

    tl.fromTo(node,
      {
        x: baseX,
        y: baseY,
        scale: 0.3,
        opacity: 0,
        svgOrigin: 'center center',
      },
      {
        x: slot.x,
        y: slot.y,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.4)',   // the sanctioned exception
      },
      delay,
    );
  });

  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLAPSE (§7) — exhale, ~0.65s
// Lines retract first → nodes implode back to base → field restores
// Ease inversion: .in curves (accelerate away)
// ─────────────────────────────────────────────────────────────────────────────

interface CollapseArgs {
  otherNodes: SVGGElement[];
  selectedNode: SVGGElement;
  pairingNodes: SVGGElement[];
  lineEls: SVGLineElement[];
  lineLengths: number[];
  baseX: number;
  baseY: number;
}

export function buildCollapseTimeline({
  otherNodes,
  selectedNode,
  pairingNodes,
  lineEls,
  lineLengths,
  baseX,
  baseY,
}: CollapseArgs) {
  const tl = createTimeline();

  // Lines retract first (§7)
  lineEls.forEach((line, i) => {
    const len = lineLengths[i];
    tl.to(line, {
      strokeDashoffset: len,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
    }, 0);
  });

  // Nodes implode back to base — reverse-clockwise stagger (§7)
  if (pairingNodes.length) {
    tl.to(pairingNodes, {
      x: baseX,
      y: baseY,
      scale: 0.3,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      stagger: { each: 0.03, from: 'end' },
    }, 0.05);
  }

  // Field restores
  if (otherNodes.length) {
    tl.to(otherNodes, {
      opacity: 1,
      scale: 1,
      svgOrigin: 'center center',
      duration: 0.4,
      ease: 'power2.inOut',
    }, 0.25);
  }

  tl.to(selectedNode, {
    scale: 1,
    svgOrigin: 'center center',
    duration: 0.4,
    ease: 'power2.inOut',
  }, 0.25);

  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE HOVER (§2)
// ─────────────────────────────────────────────────────────────────────────────

export function animateBaseHoverIn(el: SVGGElement) {
  gsap.to(el, {
    scale: 1.12,
    svgOrigin: 'center center',
    duration: 0.25,
    ease: 'expo.out',
    overwrite: 'auto',
  });
}

export function animateBaseHoverOut(el: SVGGElement) {
  gsap.to(el, {
    scale: 1,
    svgOrigin: 'center center',
    duration: 0.45,
    ease: 'power2.inOut',
    overwrite: 'auto',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAIRING HOVER (§5) — lighter than base hover
// ─────────────────────────────────────────────────────────────────────────────

export function animatePairingHoverIn(node: SVGGElement, line: SVGLineElement | null) {
  gsap.to(node, {
    scale: 1.08,
    svgOrigin: 'center center',
    duration: 0.18,
    ease: 'expo.out',
    overwrite: 'auto',
  });
  if (line) {
    gsap.to(line, {
      opacity: 0.9,
      strokeWidth: 1.5,
      duration: 0.2,
      ease: 'power2.out',
    });
  }
}

export function animatePairingHoverOut(node: SVGGElement, line: SVGLineElement | null) {
  gsap.to(node, {
    scale: 1,
    svgOrigin: 'center center',
    duration: 0.35,
    ease: 'power2.inOut',
    overwrite: 'auto',
  });
  if (line) {
    gsap.to(line, {
      opacity: 0.35,
      strokeWidth: 0.5,
      duration: 0.3,
      ease: 'power2.inOut',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT FILTER (§6) — simultaneous, no stagger
// ─────────────────────────────────────────────────────────────────────────────

export function animateContextFilter(
  matchNodes: SVGGElement[],
  dimNodes: SVGGElement[],
  matchLines: SVGLineElement[],
  dimLines: SVGLineElement[],
) {
  const params = { duration: 0.35, ease: 'power2.inOut' };

  if (matchNodes.length) gsap.to(matchNodes, { opacity: 1, scale: 1.04, svgOrigin: 'center center', ...params });
  if (dimNodes.length)   gsap.to(dimNodes,   { opacity: 0.18, ...params });
  if (matchLines.length) gsap.to(matchLines, { opacity: 0.55, ...params });
  if (dimLines.length)   gsap.to(dimLines,   { opacity: 0.08, ...params });
}

export function animateContextClear(
  allNodes: SVGGElement[],
  allLines: SVGLineElement[],
) {
  const params = { duration: 0.35, ease: 'power2.inOut' };
  if (allNodes.length) gsap.to(allNodes, { opacity: 1, scale: 1, svgOrigin: 'center center', ...params });
  if (allLines.length) gsap.to(allLines, { opacity: 0.35, strokeWidth: 0.5, ...params });
}
