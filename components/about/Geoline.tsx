"use client";

import {
  Terminal,
  GraduationCap,
  Building2,
  BrainCircuit,
  Award,
  Sparkles,
  Compass,
  type LucideIcon,
} from "lucide-react";
import type { TimelineEntry } from "@/data/content";
import { cn } from "@/lib/utils";
import { SerpentineTimeline } from "@/components/timeline/SerpentineTimeline";

/**
 * The /about journey ("How I Got Here") — now a thin data adapter over the shared
 * <SerpentineTimeline> "Synapse" engine. This component owns ONLY the milestone-card
 * look + the positional icon/tag map; the bold serpentine, the scroll choreography,
 * the orb, the synapse firing, the live counter, the CLS=0 placement and the a11y
 * <ol> all live in the engine (and are identical on /work). See PORTFOLIO_UPGRADE_PLAN
 * Phase 4 for the design rationale.
 */

// Positional icon/tag map, keyed to the data/content.ts `timeline` order (the data
// shape TimelineEntry = {period,title,description} is untouched). A milestone past the
// end falls back to the last entry, so adding one never crashes SSR.
type Kind = { Icon: LucideIcon; tag: string };
const KIND: Kind[] = [
  { Icon: Terminal, tag: "Origin" },
  { Icon: GraduationCap, tag: "Education" },
  { Icon: Building2, tag: "Role" },
  { Icon: BrainCircuit, tag: "Milestone" },
  { Icon: Award, tag: "Award" },
  { Icon: Sparkles, tag: "Role" },
  { Icon: Compass, tag: "Independent" },
];

export function Geoline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <SerpentineTimeline
      count={entries.length}
      hudLabel="Milestones lit"
      renderCard={(i, _side, isActive) => {
        const entry = entries[i];
        const { Icon, tag } = KIND[i] ?? KIND[KIND.length - 1];
        return (
          <article
            className={cn(
              "group relative isolate w-full overflow-hidden rounded-[18px] p-[22px]",
              // Glass surface (translucent tint + cheap blur md+ only; mobile near-solid).
              "border border-line bg-base/85",
              "md:bg-[linear-gradient(180deg,oklch(22.5%_0.016_278/0.72),oklch(14.5%_0.012_278/0.66))] md:[backdrop-filter:blur(10px)_saturate(125%)]",
              "shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(235,236,250,0.10)]",
              "transition-[box-shadow,background-color,border-color] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              // 1px gradient ring (the "glowing edge") via mask-composite.
              "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:p-px after:content-['']",
              "after:[background:linear-gradient(150deg,oklch(66%_0.19_285/0.45),oklch(86%_0.115_207/0.16)_40%,transparent_70%)]",
              "after:[-webkit-mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)] after:[mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)]",
              "after:[-webkit-mask-clip:content-box,border-box] after:[mask-clip:content-box,border-box]",
              "after:[-webkit-mask-composite:xor] after:[mask-composite:exclude]",
              "after:opacity-70 after:transition-opacity after:duration-[450ms]",
              // Active (synapse fired): bg lift + ring + bloom — border/shadow/bg only.
              isActive &&
                "border-transparent bg-[linear-gradient(180deg,oklch(22.5%_0.016_278/0.80),oklch(14.5%_0.012_278/0.72))] shadow-[0_0_0_1px_oklch(66%_0.19_285/0.20),0_22px_60px_-30px_rgba(0,0,0,0.9),0_0_44px_-16px_oklch(63%_0.21_272/0.45),inset_0_1px_0_rgba(235,236,250,0.14)] after:opacity-100 after:[background:linear-gradient(150deg,oklch(66%_0.19_285/0.85),oklch(86%_0.115_207/0.40)_45%,oklch(63%_0.21_272/0.15)_80%)]",
            )}
          >
            {/* Gradient accent leading edge. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[24px] top-0 h-[2px] w-[44px] rounded-[2px] bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-cyan))] opacity-90 shadow-[0_0_12px_-2px_var(--color-accent)]"
            />

            {/* Header row: ICON . TAG ......... PERIOD */}
            <div className="mb-[14px] flex items-center gap-[10px]">
              <span className="grid size-[30px] flex-none place-items-center rounded-[9px] border border-accent/20 bg-accent/10 text-accent">
                {Icon && <Icon aria-hidden strokeWidth={1.75} className="size-4" />}
              </span>
              <span className="rounded-full border border-line bg-[oklch(94.5%_0.012_280/0.04)] px-[9px] py-[3px] font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                {tag}
              </span>
              <span className="ml-auto font-mono text-xs tabular-nums tracking-[0.02em] text-accent">
                {entry.period}
              </span>
            </div>

            <h3 className="mb-2 font-display text-lg font-semibold leading-[1.25] tracking-[-0.01em] text-ink">
              {entry.title}
            </h3>
            <p className="text-[13.5px] leading-[1.6] text-ink-dim">{entry.description}</p>
          </article>
        );
      }}
    />
  );
}
