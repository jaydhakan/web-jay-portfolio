/**
 * The Flight — canvas palette.
 *
 * Canvas 2D needs numeric colour components to build `rgba()` strings cheaply
 * (thousands of times a frame), and the site's tokens are oklch() in CSS. These
 * are the documented hex twins from globals.css, kept in the same order as that
 * file's table. If a token moves there, move it here.
 *
 * The prototype used its own standalone palette (#5B5BF0/#9D5BF0/#5BD9F0); that
 * was a host constraint, not a design decision, so it is mapped onto this site's
 * iridescent duotone instead — same indigo -> violet -> cyan progression.
 */

/** --accent #6b7cff — electric indigo, the near end of the beacon ramp. */
export const ACCENT = [107, 124, 255] as const;
/** --accent-violet #8b7cff — duotone middle stop (path ribbon, epoch cards). */
export const VIOLET = [139, 124, 255] as const;
/** --accent-cyan #67e8f9 — duotone far stop (reticle, lock-on, tether dot). */
export const CYAN = [103, 232, 249] as const;
/** --ink #ebecfa — star dust and station numerals. */
export const INK = [235, 236, 250] as const;
/** --base #0b0b11 — the vignette fade. */
export const BASE = [11, 11, 17] as const;

/**
 * Beacon colour for station `i` of `n`: a ramp from indigo at the start of the
 * run to cyan at the end, so depth in the flight reads as a colour temperature.
 * Returns a pre-baked "r,g,b" string — hoisted per beacon at build time, never
 * rebuilt per particle.
 */
export function beaconRamp(i: number, n: number): string {
  const t = n > 1 ? i / (n - 1) : 0;
  const r = Math.round(ACCENT[0] + (CYAN[0] - ACCENT[0]) * t);
  const g = Math.round(ACCENT[1] + (CYAN[1] - ACCENT[1]) * t);
  const b = Math.round(ACCENT[2] + (CYAN[2] - ACCENT[2]) * t);
  return `${r},${g},${b}`;
}

export const rgba = (c: readonly number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Star-dust colour for alpha bucket `k` of `n`.
 *
 * Atmospheric perspective: the dimmest (most distant) dust is tinted toward the
 * cool end of the duotone and the brightest (nearest) is near-white ink. Costs
 * nothing — these six strings are baked once at build time.
 */
export function dustBucket(k: number, n: number, alpha: number): string {
  const t = n > 1 ? k / (n - 1) : 1;
  const r = Math.round(ACCENT[0] + (INK[0] - ACCENT[0]) * t);
  const g = Math.round(ACCENT[1] + (INK[1] - ACCENT[1]) * t);
  const b = Math.round(ACCENT[2] + (INK[2] - ACCENT[2]) * t);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * A pre-rendered radial bloom sprite for a beacon core.
 *
 * Built ONCE per beacon at build time and blitted with drawImage under
 * `globalCompositeOperation = "lighter"`, which is what turns a flat disc into
 * something that reads as a light source. Building a gradient per beacon per
 * frame would be far too expensive; blitting nine cached sprites is free.
 */
export function bloomSprite(rgb: string, size = 128): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  if (!x) return null;
  const h = size / 2;
  const g = x.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0, `rgba(${rgb},0.85)`);
  g.addColorStop(0.18, `rgba(${rgb},0.42)`);
  g.addColorStop(0.5, `rgba(${rgb},0.11)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return c;
}
