import gsap from 'gsap';

// One place to ask "should things move?". Read live so a change in system
// settings takes effect without a reload.
const query = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export function prefersReducedMotion(): boolean {
  return !!query?.matches;
}

// With reduced motion on, every GSAP tween and timeline runs ten times faster,
// so transitions resolve almost instantly instead of flying, bouncing or
// drifting. Ambient drift, pulses and the shockwave are switched off at source.
function apply() {
  gsap.globalTimeline.timeScale(prefersReducedMotion() ? 10 : 1);
}
apply();
query?.addEventListener?.('change', apply);
