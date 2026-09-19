import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { FlightItem } from "@/lib/flight/types";
import { cn } from "@/lib/utils";

/**
 * One hologram card — the DOM half of a beacon.
 *
 * POSITIONING: the host <div> is moved every frame by the engine (transform +
 * opacity + a quantised blur), which is why it carries no layout classes of its
 * own and why `contain: layout style` is set — a card can never dirty the rest
 * of the page's layout.
 *
 * ACCESSIBILITY: the whole card layer is aria-hidden and every interactive
 * element inside it is tabIndex={-1}. This is deliberate. These cards are a
 * DECORATIVE DUPLICATE of <FlightFallback>, which is the real, always-present,
 * correctly-ordered content below the flight. Keyboard and screen-reader users
 * get the list; pointer users can still click a card through to its case study.
 * (aria-hidden is only an a11y violation when it hides FOCUSABLE content — hence
 * the tabIndex.)
 */

type HoloCardProps = {
  item: FlightItem;
  index: number;
};

/** Shared surface: the glass treatment the whole card family uses. */
const surface =
  "relative overflow-hidden rounded-2xl border bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] " +
  "backdrop-blur-xl [[data-noglass]_&]:backdrop-blur-none " +
  "[[data-noglass]_&]:bg-[color-mix(in_oklab,var(--surface)_96%,transparent)]";

export function HoloCard({ item, index }: HoloCardProps) {
  return (
    <div
      data-flight-card={index}
      // Hidden until the engine's first frame places it, so nothing flashes at
      // 0,0 before the loop starts.
      className="pointer-events-auto absolute left-0 top-0 invisible opacity-0 [contain:layout_style]"
    >
      {item.variant === "deep" && <DeepCard item={item} />}
      {item.variant === "log" && <LogCard item={item} />}
      {item.variant === "epoch" && <EpochCard item={item} />}
    </div>
  );
}

function DeepCard({ item }: { item: Extract<FlightItem, { variant: "deep" }> }) {
  return (
    <Link
      href={item.href}
      tabIndex={-1}
      className={cn(
        surface,
        "group block w-[min(390px,78vw)] border-accent-cyan/25 p-7",
        "shadow-[0_0_60px_-10px_oklch(63%_0.21_272/0.35)]",
        "transition-colors duration-300 hover:border-accent-cyan/50",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-cyan">
          {item.tag}
        </span>
        <span className="font-mono text-[9.5px] tracking-[0.12em] text-ink-dim">{item.meta}</span>
      </div>

      <p className="mt-3.5 font-display text-5xl font-bold leading-none tracking-[-0.035em] text-ink">
        {item.metric}
      </p>
      <p className="mt-1.5 font-mono text-[10.5px] tracking-[0.14em] text-ink-dim">
        {item.metricLabel}
      </p>

      <h3 className="mt-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">
        {item.title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-dim">{item.description}</p>

      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-cyan">
        Read the case study
        <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

function LogCard({ item }: { item: Extract<FlightItem, { variant: "log" }> }) {
  return (
    <Link
      href={item.href}
      tabIndex={-1}
      className={cn(
        surface,
        "block w-[min(320px,72vw)] border-line px-6 py-[18px]",
        "shadow-[0_0_40px_-12px_oklch(63%_0.21_272/0.3)]",
        "transition-colors duration-300 hover:border-accent-cyan/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          {item.tag}
        </span>
        {/* Collapses entirely when the project has no quantified outcome. */}
        {item.metric && (
          <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-accent-cyan">
            {item.metric}
          </span>
        )}
      </div>
      <p className="mt-1.5 font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
        {item.title}
      </p>
    </Link>
  );
}

function EpochCard({ item }: { item: Extract<FlightItem, { variant: "epoch" }> }) {
  return (
    <article
      className={cn(
        surface,
        "w-[min(370px,78vw)] border-accent-violet/30 p-6",
        "shadow-[0_0_60px_-10px_oklch(66%_0.19_285/0.32)]",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-violet">
          {item.tag}
        </span>
        <span className="font-mono text-[10.5px] font-semibold text-accent-cyan">
          LOSS {item.loss}
        </span>
      </div>

      {/* The loss curve so far: a 1px bar whose fill IS this epoch's position on
          the descent. Derived from the same fitted curve as the readout, so the
          two can never disagree. */}
      <div aria-hidden className="mt-3 h-px w-full bg-line">
        <div
          className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan"
          style={{ width: `${(1 - item.lossT) * 100}%` }}
        />
      </div>

      <h3 className="mt-3 font-display text-[21px] font-semibold tracking-[-0.02em] text-ink">
        {item.title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-dim">{item.description}</p>
    </article>
  );
}
