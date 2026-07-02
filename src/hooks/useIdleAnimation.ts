import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── IDLE ANIMATION (§1 of animation spec) ───────────────────────────────────
// Breathing: per-node opacity 0.75 → 1.0, randomized phase so field never syncs
// Ignite (first load): nodes fade-scale in from center outward
// Twinkle: random node brightens every 8-14s
// ─────────────────────────────────────────────────────────────────────────────

export function useIdleAnimation(
  nodeRefs: React.MutableRefObject<Map<string, SVGGElement>>,
  fontIds: string[],
  isActive: boolean, // false when a node is selected (breathing pauses)
) {
  const breathingTweens = useRef<gsap.core.Tween[]>([]);
  const twinkleCall = useRef<gsap.core.Tween | null>(null);
  const ignited = useRef(false);

  // First-load ignite — runs once
  useEffect(() => {
    if (ignited.current || fontIds.length === 0) return;
    ignited.current = true;

    const els: SVGGElement[] = [];
    fontIds.forEach(id => {
      const el = nodeRefs.current.get(id);
      if (el) els.push(el);
    });

    if (!els.length) return;

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(els,
        { opacity: 0, scale: 0.6, svgOrigin: 'center center' },
        {
          opacity: 1,
          scale: 1,
          svgOrigin: 'center center',
          duration: 0.9,
          ease: 'expo.out',
          stagger: { each: 0.03, from: 'center' },
        },
      );
    });

    gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(els, { opacity: 1, scale: 1 });
    });
  }, [fontIds, nodeRefs]);

  // Breathing + twinkle — only when idle (no selection)
  useEffect(() => {
    if (!isActive) {
      // Kill all tweens
      breathingTweens.current.forEach(t => t.kill());
      breathingTweens.current = [];
      if (twinkleCall.current) { twinkleCall.current.kill(); twinkleCall.current = null; }
      return;
    }

    const els: SVGGElement[] = [];
    fontIds.forEach(id => {
      const el = nodeRefs.current.get(id);
      if (el) els.push(el);
    });

    // Breathing — prefers-reduced-motion skips this
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      els.forEach(el => {
        const tween = gsap.to(el, {
          opacity: gsap.utils.random(0.75, 1.0),
          duration: gsap.utils.random(3.5, 5.5),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 6),
        });
        breathingTweens.current.push(tween);
      });

      // Twinkle scheduler
      const scheduleTwinkle = () => {
        twinkleCall.current = gsap.to({}, { duration: gsap.utils.random(8, 14), onComplete: () => {
          const el = els[Math.floor(Math.random() * els.length)];
          if (!el) return;
          gsap.to(el, {
            opacity: 1,
            scale: 1.15,
            svgOrigin: 'center center',
            duration: 0.4,
            ease: 'expo.out',
            onComplete: () => {
              gsap.to(el, {
                opacity: 0.85,
                scale: 1,
                svgOrigin: 'center center',
                duration: 0.9,
                ease: 'power2.inOut',
              });
            },
          });
          scheduleTwinkle();
        }});
      };
      scheduleTwinkle();
    });

    return () => {
      breathingTweens.current.forEach(t => t.kill());
      breathingTweens.current = [];
      if (twinkleCall.current) { twinkleCall.current.kill(); twinkleCall.current = null; }
    };
  }, [isActive, fontIds, nodeRefs]);
}
