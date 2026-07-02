import { useMemo } from 'react';

// Seeded LCG — deterministic star positions across reloads
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

interface Star { x: number; y: number; r: number; opacity: number }

export function StarField({ w, h }: { w: number; h: number }) {
  const stars = useMemo<Star[]>(() => {
    const rng = makeRng(0xf0ede8);
    return Array.from({ length: 220 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      r: rng() < 0.85 ? rng() * 0.6 + 0.3 : rng() * 1 + 0.8, // mostly tiny, a few larger
      opacity: rng() * 0.08 + 0.02,  // 2–10%
    }));
  }, []);

  return (
    <g aria-hidden="true" pointerEvents="none">
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={(s.x / 100) * w}
          cy={(s.y / 100) * h}
          r={s.r}
          fill="#f0ede8"
          opacity={s.opacity}
        />
      ))}
    </g>
  );
}
