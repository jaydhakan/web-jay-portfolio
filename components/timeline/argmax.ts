/**
 * Timeline score — the per-milestone narrative weight the Constellation Spine reads.
 * Pure and deterministic (SSR-stable): the /about journey uses the authored ABOUT_SCORE,
 * /work derives one procedurally from its shipped-systems count.
 *
 * History: this file once encoded a full "ARGMAX lightning-bolt" geometry (kinks, ghost
 * fans, scars, an open delta). That set-piece was retired for being illegible; only the
 * `weight` knob survived, because it's the one signal the cards actually read (heavier
 * milestones get larger, louder cards). Recover the old geometry from git if ever needed.
 */

import { hash01 } from "./geometry";

/** One milestone's narrative weight. Extra fields are kept for authoring intent /
 *  back-compat with the /about score literal; only `weight` reaches the screen today. */
export type Beat = {
  /** 0..1 emphasis — drives card size, title scale, and node prominence. */
  weight: number;
  ghosts?: number;
  run?: number;
  turn?: -1 | 0 | 1;
  kink?: number;
  caliber?: number;
};

// The authored /about journey (7 beats — quiet start, the surge in the middle, the
// open-ended present). Only `weight` is load-bearing now.
export const ABOUT_SCORE: Beat[] = [
  { weight: 0.55 },
  { weight: 0.35 },
  { weight: 0.8 },
  { weight: 1.0 },
  { weight: 0.5 },
  { weight: 0.7 },
  { weight: 1.0 },
];

/** Procedural score for /work (N shipped systems): a deterministic weight per system,
 *  with the last one and any caller-marked featured systems pinned heavy. `weights[i]`
 *  lets the adapter flag featured projects. */
export function scoreForCount(n: number, weights?: (number | undefined)[]): Beat[] {
  const beats: Beat[] = [];
  for (let i = 0; i < n; i++) {
    const w = weights?.[i] ?? 0.45 + hash01(`wk.${i}.w`) * 0.4;
    const last = i === n - 1;
    beats.push({ weight: last ? Math.max(w, 0.85) : w });
  }
  return beats;
}
