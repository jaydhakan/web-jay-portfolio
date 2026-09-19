import Link from "next/link";
import type { FlightItem } from "@/lib/flight/types";
import { SectionLabel } from "@/components/ui/SectionLabel";

/**
 * The accessible content.
 *
 * This list is NOT a fallback in the "shown only when things break" sense — it
 * is ALWAYS in the DOM, below the flight, in correct reading order, with real
 * headings and real links. The canvas above it is decorative chrome over the
 * same information.
 *
 * It is therefore what these users actually get, and all of them get everything:
 *   - screen readers and keyboard users (the flight layer is aria-hidden)
 *   - no-JS and crawlers (server-rendered; the canvas never boots)
 *   - < 680px viewports (the engine collapses the flight's runway to zero)
 *   - anyone who followed the "Skip the flight" link
 */
export function FlightFallback({
  id,
  items,
  eyebrow,
  heading,
  blurb,
  headingLevel = "h2",
}: {
  id: string;
  items: FlightItem[];
  eyebrow: string;
  heading: string;
  blurb: string;
  /** h2 when the page already owns an h1 above the flight. */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const Item = headingLevel === "h2" ? "h3" : "h4";

  return (
    <section
      id={id}
      // tabIndex so the skip link can move focus here, not just scroll to it.
      tabIndex={-1}
      className="relative z-10 mx-auto max-w-5xl scroll-mt-24 px-6 focus:outline-none"
    >
      <SectionLabel>{eyebrow}</SectionLabel>
      <Heading className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">
        {heading}
      </Heading>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-dim">{blurb}</p>

      <ul className="mt-11 flex flex-col gap-2.5">
        {items.map((item) => {
          const href = item.variant === "epoch" ? null : item.href;
          const body = (
            <>
              <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-muted">
                {item.num}
              </span>
              <span className="min-w-[240px] flex-1">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-violet">
                  {item.tag}
                </span>
                <Item className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">
                  {item.title}
                </Item>
                <span className="mt-1.5 block max-w-[520px] text-[13.5px] leading-relaxed text-ink-dim">
                  {item.description}
                </span>
              </span>
              {item.metric && (
                <span className="shrink-0 whitespace-nowrap font-mono text-[15px] font-semibold text-accent-cyan">
                  {item.metric}
                </span>
              )}
            </>
          );

          const shell =
            "flex flex-wrap items-baseline gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface px-6 py-5 transition-[border-color,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)]";

          return (
            <li key={item.id}>
              {href ? (
                <Link
                  href={href}
                  className={`${shell} hover:translate-x-1 hover:border-accent-cyan/40 motion-reduce:hover:translate-x-0`}
                >
                  {body}
                </Link>
              ) : (
                <div className={shell}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
