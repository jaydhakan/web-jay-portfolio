/**
 * Film grain (catalog #35, plan §4.5): one fixed, pointer-events-none leaf at
 * z-30 carrying a STATIC feTurbulence noise tile as a data-URI background. The
 * noise is pre-rasterized once by the browser and tiled — zero JS, zero runtime
 * filter, zero animation, so it costs nothing on scroll.
 *
 * The tile is monochrome ALPHA-only (feColorMatrix routes the noise into alpha,
 * RGB zeroed), so it never tints the indigo palette — opacity is the only tone
 * knob. NO mix-blend-mode and NO isolation: it is a plain alpha-composited leaf
 * painted into the root stacking context BELOW the z-60 mix-blend-difference
 * cursor (which therefore still inverts over it). Static, so it stays under
 * reduced motion (plan: "grain may stay").
 *
 * CUT CRITERION (the hard gate, R9): if mobile OR desktop Lighthouse Performance
 * drops below 95 with this mounted vs. removed, delete the mount — grain is the
 * first thing cut.
 */
const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E";

export function FilmGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        backgroundImage: `url("${GRAIN_URI}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "160px 160px",
        opacity: 0.032,
      }}
    />
  );
}
