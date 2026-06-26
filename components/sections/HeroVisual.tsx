import { Fragment } from "react";
import {
  Database,
  BrainCircuit,
  Boxes,
  Rocket,
  Check,
  type LucideIcon,
} from "lucide-react";
import { hero } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Hero right-side "live system" console (P1). A self-contained, server-rendered
 * CSS/SVG panel — NOT a second WebGL canvas (the page-wide LatentField is the one
 * canon canvas per route). It reinforces the positioning ("products that ship")
 * with a relevant automation pipeline + deploy readout, not decorative filler.
 *
 * Premium card grammar (DESIGN.md): a double-bezel glass shell, a soft top-lip
 * highlight, a 1px gradient ring, and a restrained ambient glow — never a
 * box-shadow tween. Motion is opacity/transform/stroke-dashoffset only and gated
 * behind the `motion-safe:` variant, so reduced motion shows a clean static frame.
 * Rendered desktop-only (xl+) by the Hero; aria-hidden because the credibility
 * proof it visualizes is also announced as real text in the hero metric strip.
 */

const STAGE_ICONS: Record<string, LucideIcon> = {
  Database,
  BrainCircuit,
  Boxes,
  Rocket,
};

/* Flowing dashed connector between two pipeline stages — the "records in transit"
   motif (reuses the bento-flow keyframe). preserveAspectRatio="none" lets the
   single 40-unit line stretch to fill whatever gap flex hands it. */
function Connector() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 4"
      preserveAspectRatio="none"
      className="h-1 flex-1 self-start"
      style={{ marginTop: "1.25rem" }}
    >
      <line x1="0" y1="2" x2="40" y2="2" stroke="var(--color-line)" strokeWidth="2" />
      <line
        x1="0"
        y1="2"
        x2="40"
        y2="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 5"
        className="text-accent/70 motion-safe:animate-bento-flow"
      />
    </svg>
  );
}

export function HeroVisual() {
  const v = hero.visual;

  return (
    <div className="relative w-full max-w-[420px]" aria-hidden>
      {/* Ambient bloom behind the panel — a pre-rendered radial, not a shadow. */}
      <div className="pointer-events-none absolute -inset-10 -z-10 [background:radial-gradient(60%_55%_at_60%_35%,oklch(63%_0.21_272/0.18),transparent_70%)]" />

      {/* Console: double-bezel glass shell -> inner core. */}
      <div className="relative rounded-[22px] bg-white/[0.03] p-1.5 ring-1 ring-white/[0.08] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)]">
        <div className="relative overflow-hidden rounded-[17px] bg-[linear-gradient(180deg,oklch(22.5%_0.016_278/0.92),oklch(14.5%_0.012_278/0.9))]">
          {/* top-lip highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          {/* Chrome bar */}
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-err/70" />
              <span className="size-2.5 rounded-full bg-ok/50" />
              <span className="size-2.5 rounded-full bg-accent/60" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.04em] text-ink-dim">
              {v.file}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-ok/25 bg-ok/10 px-2 py-0.5">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-ok" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ok">
                live
              </span>
            </span>
          </div>

          {/* Pipeline: 4 stages connected by flowing dashed edges. */}
          <div className="px-5 pb-5 pt-6">
            <div className="flex items-start justify-between gap-1">
              {v.stages.map((stage, i) => {
                const Icon = STAGE_ICONS[stage.icon] ?? Boxes;
                const isLast = i === v.stages.length - 1;
                return (
                  <Fragment key={stage.label}>
                    <div className="flex w-12 shrink-0 flex-col items-center gap-2">
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl border text-accent",
                          isLast
                            ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
                            : "border-accent/25 bg-accent/10",
                        )}
                      >
                        <span
                          className="motion-safe:animate-bento-node"
                          style={{ animationDelay: `${i * 0.45}s` }}
                        >
                          <Icon aria-hidden strokeWidth={1.75} className="size-[18px]" />
                        </span>
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
                        {stage.label}
                      </span>
                    </div>
                    {!isLast && <Connector />}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* Deploy log readout */}
          <div className="space-y-2 border-t border-line px-5 py-4">
            {v.logs.map((line, i) => {
              const isLast = i === v.logs.length - 1;
              return (
                <p key={line} className="flex items-center gap-2 font-mono text-[12px] leading-none">
                  <Check
                    aria-hidden
                    strokeWidth={3}
                    className={cn("size-3 shrink-0", isLast ? "text-accent-cyan" : "text-ok")}
                  />
                  <span className={isLast ? "text-ink" : "text-ink-dim"}>{line}</span>
                  {isLast && (
                    <span className="ml-0.5 inline-block h-3.5 w-[7px] bg-accent-cyan/90 motion-safe:animate-hero-caret" />
                  )}
                </p>
              );
            })}
          </div>

          {/* Footer status bar */}
          <div className="flex items-center justify-between border-t border-line bg-white/[0.015] px-5 py-3">
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-dim">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-ok" />
              {v.status.label}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-accent">
              {v.status.metric}
            </span>
          </div>
        </div>
      </div>

      {/* Floating stat chips — depth + product feel. Gentle ambient drift only. */}
      <div className="pointer-events-none absolute -right-5 -top-5 motion-safe:animate-hero-float-a">
        <div className="rounded-2xl border border-line bg-elevated/95 px-3.5 py-2.5 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.9)]">
          <p className="font-mono text-lg font-semibold tabular-nums leading-none text-ink">
            {v.chipTop.metric}
          </p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ok">
            {v.chipTop.label}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-5 -left-6 motion-safe:animate-hero-float-b">
        <div className="rounded-2xl border border-line bg-elevated/95 px-3.5 py-2.5 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.9)]">
          <p className="font-mono text-lg font-semibold tabular-nums leading-none text-ink">
            {v.chipBottom.metric}
          </p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent">
            {v.chipBottom.label}
          </p>
        </div>
      </div>
    </div>
  );
}
