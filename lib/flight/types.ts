/**
 * The Flight — content contract.
 *
 * ONE component (<FlightStage>) renders both /work and /about; the only thing
 * that differs is the item array. Everything the canvas + cards need is on the
 * item, so a beacon can carry its own item reference and never index back into
 * a shared array that could be swapped mid-frame (the dataset-swap crash class
 * called out in the port brief).
 */

/** Discriminator for the three card shapes. */
export type FlightVariant = "deep" | "log" | "epoch";

type FlightItemBase = {
  /** Stable, unique across BOTH datasets — used for DOM ids and deep links. */
  id: string;
  /** "01".."09" — rendered at the beacon and in the rail. */
  num: string;
  /** Mono eyebrow, e.g. "AI & AGENTS · DEEP DIVE". */
  tag: string;
  title: string;
  /** Filter key. "All" always matches; undefined items never match a filter. */
  category?: string;
  /**
   * Relationship keys. Two nearby stations that share one get a faint arc drawn
   * between them in the canvas — the Constellation Spine knowledge-graph idea
   * from the old timeline, carried into the flight. Category on /work,
   * `connections` on /about. Omit to draw no arcs.
   */
  links?: readonly string[];
};

/** Large /work card: metric + label + description + case-study link. */
export type FlightDeepItem = FlightItemBase & {
  variant: "deep";
  /** Headline number, e.g. "90%" — deep cards are metric-led, so it is required. */
  metric: string;
  metricLabel: string;
  description: string;
  href: string;
  /** Right-aligned meta line, e.g. "5 SECTIONS · 2025". */
  meta: string;
};

/** Compact /work card: one line + metric. */
export type FlightLogItem = FlightItemBase & {
  variant: "log";
  /**
   * OPTIONAL on purpose. Not every project has a quantified outcome (CinqCare
   * has none in the source resume, per data/content.ts), and a card is better
   * with an empty metric slot than with an invented number or a paragraph
   * crammed into a numeral slot. The slot collapses when this is absent.
   */
  metric?: string;
  description: string;
  href: string;
};

/** /about card: epoch + descending loss readout. */
export type FlightEpochItem = FlightItemBase & {
  variant: "epoch";
  /** "LOSS 2.41" — the epoch's readout, mirrored into the fallback list. */
  metric: string;
  description: string;
  /** Formatted to 2dp, e.g. "2.41". Descends across the run. */
  loss: string;
  /** 0..1 position on the loss curve — drives the card's mini sparkline. */
  lossT: number;
};

export type FlightItem = FlightDeepItem | FlightLogItem | FlightEpochItem;

/** Category-filter config for /work. `options[0]` is the neutral "show all" key. */
export type FlightFilter = {
  options: readonly string[];
  /** aria-label prefix for the filter group. */
  label: string;
};
