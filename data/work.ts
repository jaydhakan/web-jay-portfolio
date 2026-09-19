/**
 * /work as flight stations.
 *
 * DERIVED, not duplicated: the nine projects live in data/content.ts and this
 * file is a typed projection of them onto the FlightItem contract. Editing a
 * project's copy in one place updates the flight, the fallback list and the
 * case study together.
 *
 * Card shape follows `featured`: the three featured projects become "deep"
 * cards (metric + label + description + case-study link), the other six become
 * compact "log" cards. That split is content-driven, so promoting a project in
 * content.ts re-shapes its station automatically.
 */
import { projects, sections, type Project, type Stat } from "@/data/content";
import type { FlightFilter, FlightItem } from "@/lib/flight/types";

/**
 * Render a Stat the way the case-study page does: "90%", "<5 min", "15M+".
 *
 * The headline metric is taken from the project's FIRST structured result
 * rather than parsed out of the `result` prose — several projects lead with
 * words ("Live chatbot in <5 minutes"), and guessing where the number ends
 * produced wrong headlines. Structured data in, structured data out.
 */
function formatStat(s: Stat): string {
  const value = s.decimals ? s.value.toFixed(s.decimals) : String(s.value);
  return `${s.prefix ?? ""}${value}${s.suffix ?? ""}`;
}

/**
 * The card's headline metric, or null when the project has no quantified
 * outcome at all (CinqCare — content.ts notes the source resume has no numbers
 * for it). Callers collapse the metric slot rather than inventing a figure or
 * spilling the prose `result` into a numeral slot.
 */
function headline(p: Project): { metric: string; label: string } | null {
  const first = p.caseStudy.results[0];
  if (!first) return null;
  return { metric: formatStat(first), label: first.label.toUpperCase() };
}

function toItem(p: Project, i: number): FlightItem {
  const num = String(i + 1).padStart(2, "0");
  const href = `/work/${p.slug}`;
  const head = headline(p);

  if (p.featured) {
    return {
      variant: "deep",
      id: p.slug,
      num,
      tag: `${p.category.toUpperCase()} · DEEP DIVE`,
      title: p.title,
      // Deep cards are metric-led. Every featured project has structured
      // results today; the prose `result` is a safety net, not a routine path.
      metric: head?.metric ?? p.result,
      metricLabel: head?.label ?? "OUTCOME",
      description: p.description,
      href,
      meta: `${p.client} · ${p.year}`,
      category: p.category,
      // Projects in the same category arc to each other in the canvas.
      links: [p.category],
    };
  }
  return {
    variant: "log",
    id: p.slug,
    num,
    tag: p.category.toUpperCase(),
    title: p.title,
    metric: head?.metric,
    description: p.description,
    href,
    category: p.category,
    links: [p.category],
  };
}

/** The nine /work stations, in content order. */
export const workFlightItems: FlightItem[] = projects.map(toItem);

/** Category filter — reuses the page's existing filter vocabulary. */
export const workFlightFilter: FlightFilter = {
  options: sections.workPage.filters,
  label: "Filter projects by category",
};

export const workFlightCopy = {
  eyebrow: sections.workPage.eyebrow,
  /** Two lines; the second gets the iridescent gradient treatment. */
  headline: [`${projects.length} systems in production.`, "Fly through them."],
  indexEyebrow: `INDEX — ALL ${projects.length}`,
  indexHeading: "Prefer to skim?",
  indexBlurb: "Same content, no flying. Every project above, readable end to end.",
} as const;
