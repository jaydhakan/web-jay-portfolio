/**
 * Timeline math helpers. Pure and deterministic (SSR-stable).
 *
 * History: this file once held the full ARGMAX bolt geometry (centerline, lanes,
 * constellation of stars/spurs/bridges). That set-piece was retired for being
 * illegible — recover it from git if ever needed. Only the deterministic hash
 * survives, used by the procedural /work score and the /about training-signal curve.
 */

/** Deterministic 0..1 hash (FNV-1a) — SSR-stable, so server and client agree. */
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
