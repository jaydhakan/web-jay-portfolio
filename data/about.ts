/**
 * /about as flight stations — the career as a training run.
 *
 * This file is where two sections that told the same story merge: the Geoline
 * career timeline (data/content.ts `timeline`) and "The Training Signal" loss
 * curve (`sections.trainingRun`). The epochs ARE the timeline entries now, and
 * the loss readout is derived from position on the run rather than authored
 * twice.
 *
 * DERIVED, not duplicated — same contract as data/work.ts.
 */
import { timeline, type TimelineEntry } from "@/data/content";
import type { FlightItem } from "@/lib/flight/types";

/** First and last loss values of the run — the curve is fitted between them. */
const LOSS_START = 2.41;
const LOSS_END = 0.09;

/**
 * Loss at epoch `i` of `n`, on a true exponential decay fitted to hit
 * LOSS_START at the first epoch and LOSS_END at the last.
 *
 * Deriving it (rather than hand-authoring seven numbers) keeps the metaphor
 * honest: the curve is actually convex and actually converging, so the readout
 * on the cards and the sparkline on each card can never disagree, and adding a
 * timeline entry re-fits the whole run instead of breaking the sequence.
 */
export function lossAt(i: number, n: number): number {
  if (n < 2) return LOSS_END;
  const k = Math.log(LOSS_START / LOSS_END) / (n - 1);
  return LOSS_START * Math.exp(-k * i);
}

/** 0..1 position on the loss curve, for the card's mini sparkline. */
function lossT(i: number, n: number): number {
  const v = lossAt(i, n);
  return (v - LOSS_END) / (LOSS_START - LOSS_END);
}

function toItem(entry: TimelineEntry, i: number, n: number): FlightItem {
  const num = String(i + 1).padStart(2, "0");
  const loss = lossAt(i, n).toFixed(2);
  const last = i === n - 1;
  return {
    variant: "epoch",
    id: `epoch-${i + 1}`,
    num,
    tag: `EPOCH ${num} · ${last ? "NOW" : entry.period}`,
    title: entry.title,
    metric: `LOSS ${loss}`,
    description: entry.description,
    loss,
    lossT: lossT(i, n),
    // Shared capability tags arc between epochs — the knowledge graph that the
    // Constellation Spine used to draw, now drawn in 3D.
    links: entry.connections,
  };
}

/** The seven /about stations, oldest first. */
export const aboutFlightItems: FlightItem[] = timeline.map((e, i) =>
  toItem(e, i, timeline.length),
);

export const aboutFlightCopy = {
  eyebrow: "ABOUT — THE TRAINING RUN",
  /** Two lines; the second gets the iridescent gradient treatment. */
  headline: [`${timeline.length} epochs.`, "One converging orbit."],
  indexEyebrow: `INDEX — ALL ${timeline.length} EPOCHS`,
  indexHeading: "The run, as a list.",
  indexBlurb: "Same content, no flying. The whole career, readable end to end.",
} as const;
