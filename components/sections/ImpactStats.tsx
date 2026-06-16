import { ArrowRight } from "lucide-react";
import { impact } from "@/data/content";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";
import { Counter } from "@/components/motion/Counter";
import { LineDraw } from "@/components/motion/LineDraw";

/**
 * Oversized impact set-piece (P5 / Big Swing 5). Promotes the proof numbers from
 * a quiet row into one bold editorial moment: a featured before -> after
 * transformation in huge tabular figures, then three oversized stats, each
 * *bound to the system it came from* (anti the SaaS hero-metric template). Real
 * numbers only (PRODUCT.md), distinct from the bento's live tile so the home
 * never triple-counts the same figure. Section motion = the staggered reveal +
 * scroll-counted figures; accent stays scarce (white numerals, accent accents).
 */
export function ImpactStats() {
  return (
    <section className="border-y border-line py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <RevealText
          as="h2"
          className="max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
        >
          {impact.heading}
        </RevealText>
        <FadeUp as="p" delay={0.1} className="mt-4 max-w-xl text-ink-dim">
          {impact.intro}
        </FadeUp>

        {/* Featured transformation — the signature before -> after. */}
        <FadeUp className="mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-end gap-4 font-mono tabular-nums leading-none">
              <span className="text-[clamp(2.5rem,9vw,5rem)] font-semibold text-ink-dim line-through decoration-ink-dim/40 decoration-[3px]">
                {impact.transform.from}
              </span>
              <ArrowRight
                aria-hidden
                className="mb-2 size-8 shrink-0 text-accent lg:size-10"
                strokeWidth={2}
              />
              <Counter
                value={impact.transform.to}
                suffix={impact.transform.suffix}
                decimals={impact.transform.decimals}
                className="text-[clamp(3.5rem,13vw,8rem)] font-bold leading-[0.85] text-ink"
              />
            </div>
            <LineDraw viewBox="0 0 120 2" className="mt-6 h-[2px] w-28 text-accent">
              <line data-draw x1="0" y1="1" x2="120" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </LineDraw>
          </div>
          <div className="max-w-sm lg:pb-3 lg:text-right">
            <p className="font-display text-lg font-semibold text-ink">{impact.transform.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{impact.transform.context}</p>
          </div>
        </FadeUp>

        {/* Three supporting stats, hairline-divided, oversized + bound to context. */}
        <FadeUp
          as="ul"
          stagger={0.12}
          className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-3"
        >
          {impact.stats.map((stat) => (
            <li key={stat.label} className="bg-base p-8 lg:p-10">
              <Counter
                value={stat.value}
                suffix={stat.suffix}
                className="font-mono text-[clamp(2.75rem,6vw,3.75rem)] font-semibold leading-none tracking-tight text-ink"
              />
              <p className="mt-5 font-display text-base font-semibold text-ink">{stat.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{stat.context}</p>
            </li>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
