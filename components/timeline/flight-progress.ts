/**
 * SpineProgress — the write-only side channel between the Constellation Spine's ONE
 * scrubbed ScrollTrigger and the Flight backdrop canvas (timelineplan.md §9).
 *
 * Types-only module by design: the Flight's dynamic chunk imports THIS, never the
 * engine, so three.js code can't leak into the Spine bundle and vice versa.
 *
 * Contract: the engine writes, the canvas reads — raw, once per frame, with NO
 * canvas-side smoothing (`scrub: 0.4` is the site's single smoothing stage; the
 * ARGMAX lag postmortem is why this is a hard rule).
 */
export type SpineProgress = {
  /** ScrollTrigger.progress, verbatim (already scrub-smoothed). */
  p: number;
  /** Per-milestone ignition fractions: (li.offsetTop + MARKER_TOP) / listHeight.
   *  Engine-measured; refreshed on ScrollTrigger.refresh (resize/font-swap safe). */
  offsets: number[];
  /** How many markers are currently lit (same epsilon as the DOM ignition). */
  litCount: number;
  /** /work filter mask — true = dim that beacon in place (never remove: CLS doctrine). */
  dimmed?: boolean[];
};

export const createSpineProgress = (): SpineProgress => ({
  p: 0,
  offsets: [],
  litCount: 0,
});
