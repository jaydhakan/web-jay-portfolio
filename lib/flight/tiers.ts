/**
 * The Flight — adaptive quality ladder.
 *
 * Three tiers stepping down particle counts, DPR cap and optional effects. The
 * initial tier is seeded from `navigator.hardwareConcurrency`, then demoted on a
 * rolling frame-time average. Demotion is a ONE-WAY RATCHET per session: a
 * single GC pause must never be able to oscillate the scene's look.
 */

export type Tier = {
  /** Star-dust particles drawn per frame. */
  dust: number;
  /** Swarm particles per beacon. */
  parts: number;
  /** devicePixelRatio cap. */
  dpr: number;
  /** Optional effects: chromatic split, card blur, dust streaking. */
  fx: boolean;
  /** backdrop-filter on cards (the most expensive thing on the page). */
  glass: boolean;
};

export const TIERS: readonly Tier[] = [
  { dust: 420, parts: 110, dpr: 2, fx: true, glass: true },
  { dust: 210, parts: 64, dpr: 1.5, fx: true, glass: true },
  { dust: 110, parts: 40, dpr: 1, fx: false, glass: false },
] as const;

/** Hard ceiling on the preallocated buffers — tier 0's counts. */
export const MAX_DUST = TIERS[0].dust;
export const MAX_PARTS = TIERS[0].parts;

/** Frame-time (ms) above which the rolling average triggers a demotion. */
export const DEMOTE_MS = 24;
/** Don't judge performance until the scene has settled past first paint. */
export const DEMOTE_GRACE_MS = 2500;

/** Conservative first tier on low-core hardware, then adapt from measurement. */
export function seedTier(): number {
  if (typeof navigator === "undefined") return 0;
  const cores = navigator.hardwareConcurrency || 8;
  return cores <= 4 ? 1 : 0;
}

/** Below this viewport width the flight is replaced by the fallback list. */
export const FLIGHT_MIN_WIDTH = 680;
