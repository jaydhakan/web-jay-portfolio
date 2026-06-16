import Link from "next/link";
import { ArrowUpRight, Bot, Database, MessageSquareText, Zap } from "lucide-react";
import { capabilities, sections, type Capability } from "@/data/content";
import { cn } from "@/lib/utils";
import { RevealText } from "@/components/motion/RevealText";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { Counter } from "@/components/motion/Counter";

/**
 * "What I Build" bento (P4 / Big Swing 4) — the home's capability showcase. A
 * deliberately varied-size grid (not an identical card grid): one large feature
 * tile, two compact tiles, a live-metric tile, and a wide footer tile. Each tile
 * carries a small *live computational* motif that reinforces the one idea (a
 * system, alive) and comes alive on hover; the section's single motion moment is
 * the staggered clip-reveal. All motifs are transform/opacity/stroke-only and
 * `motion-safe`-gated, so reduced motion shows a clean static frame. The full
 * service detail lives on /services.
 */

const iconFor: Record<Capability["key"], typeof Bot> = {
  agents: Bot,
  pipelines: Database,
  apis: Zap,
  chatbots: MessageSquareText,
};

const tileBase =
  "group relative flex flex-col justify-end overflow-hidden rounded-[1.25rem] bg-surface p-6 " +
  "ring-1 ring-white/[0.06] transition duration-300 ease-out will-change-transform " +
  "hover:-translate-y-1 hover:ring-accent/30 hover:bg-elevated";

/* Premium top hairline highlight, shared by every tile. */
function TopHighlight() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent"
    />
  );
}

/* Agent swarm: a manager node wired to workers; edges flow, nodes pulse. */
function AgentGraph() {
  const nodes = [
    { cx: 100, cy: 60, r: 7, delay: 0, violet: true },
    { cx: 36, cy: 28, r: 4.5, delay: 0.4 },
    { cx: 168, cy: 34, r: 4.5, delay: 1.1 },
    { cx: 28, cy: 100, r: 4.5, delay: 1.6 },
    { cx: 174, cy: 96, r: 4.5, delay: 0.8 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 2],
    [3, 4],
  ];
  return (
    <svg
      viewBox="0 0 200 128"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[64%] w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 6"
          className="text-accent opacity-40 transition-opacity duration-300 group-hover:opacity-80 motion-safe:animate-bento-flow"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="currentColor"
          className={cn("motion-safe:animate-bento-node", n.violet ? "text-accent-violet" : "text-accent")}
          style={{ animationDelay: `${n.delay}s` }}
        />
      ))}
    </svg>
  );
}

/* Data pipelines: dashed lanes whose dashes flow like records in transit. */
function PipelineFlow() {
  const lanes = [30, 54, 78];
  return (
    <svg
      viewBox="0 0 200 108"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[58%] w-full text-accent"
      preserveAspectRatio="none"
    >
      {lanes.map((y, i) => (
        <line
          key={i}
          x1="-12"
          y1={y}
          x2="212"
          y2={y}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="2 9"
          strokeLinecap="round"
          className="opacity-25 transition-opacity duration-300 group-hover:opacity-70 motion-safe:animate-bento-flow"
          style={{ animationDelay: `${i * 0.3}s`, animationDuration: `${1.6 + i * 0.5}s` }}
        />
      ))}
    </svg>
  );
}

/* High-performance APIs: a request node firing concentric pulses on hover. */
function ApiPulse() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex h-[58%] items-center justify-center"
    >
      <span className="relative grid size-10 place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute size-10 rounded-full ring-1 ring-accent/50 opacity-0 group-hover:opacity-100 motion-safe:group-hover:animate-bento-ripple"
            style={{ animationDelay: `${i * 0.55}s` }}
          />
        ))}
        <span className="size-2.5 rounded-full bg-accent-cyan shadow-[0_0_12px_var(--color-accent-cyan)]" />
      </span>
    </div>
  );
}

/* Chatbots: an idle typing indicator that animates on hover. */
function TypingDots() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-accent opacity-50 group-hover:opacity-100 motion-safe:group-hover:animate-bento-type"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function CapabilityBody({ cap }: { cap: Capability }) {
  const Icon = iconFor[cap.key];
  return (
    <div className="relative">
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className="size-5 text-accent transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
      />
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{cap.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim">{cap.blurb}</p>
      {cap.metric && (
        <p className="mt-4 font-mono text-xs text-ink-dim">
          <span className="text-ink">{cap.metric.value}</span> {cap.metric.label}
        </p>
      )}
    </div>
  );
}

export function BentoCapabilities() {
  const byKey = (k: Capability["key"]) => capabilities.find((c) => c.key === k)!;
  const agents = byKey("agents");
  const pipelines = byKey("pipelines");
  const apis = byKey("apis");
  const chatbots = byKey("chatbots");

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <RevealText
              as="h2"
              className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
            >
              {sections.capabilities.heading}
            </RevealText>
            <p className="mt-4 max-w-md text-ink-dim">{sections.capabilities.subheading}</p>
          </div>
          <Link
            href={sections.capabilities.viewAll.href}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-semibold text-ink transition-colors duration-200 hover:text-accent"
          >
            {sections.capabilities.viewAll.label}
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <ClipReveal
          as="div"
          stagger={0.09}
          className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[13.5rem]"
        >
          {/* Feature tile — AI agents */}
          <article className={cn(tileBase, "min-h-[20rem] sm:col-span-2 lg:row-span-2")} data-cursor="view">
            <TopHighlight />
            <AgentGraph />
            <CapabilityBody cap={agents} />
          </article>

          {/* Live metric tile */}
          <article className={cn(tileBase, "min-h-[13.5rem] justify-between sm:col-span-2")}>
            <TopHighlight />
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse-dot rounded-full bg-ok" />
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                Live in production
              </span>
            </div>
            <svg
              viewBox="0 0 240 60"
              aria-hidden
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-16 h-12 w-full text-accent/25"
            >
              <polyline
                points="0,48 24,40 48,44 72,30 96,34 120,20 144,26 168,12 192,18 216,6 240,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <div className="relative">
              <Counter value={15} suffix="M+" className="font-display text-5xl font-bold text-ink" />
              <p className="mt-1 text-sm text-ink-dim">
                queries handled per day, at <span className="text-ok">99.9% uptime</span>
              </p>
            </div>
          </article>

          {/* Pipelines */}
          <article className={cn(tileBase, "min-h-[13.5rem]")}>
            <TopHighlight />
            <PipelineFlow />
            <CapabilityBody cap={pipelines} />
          </article>

          {/* APIs */}
          <article className={cn(tileBase, "min-h-[13.5rem]")}>
            <TopHighlight />
            <ApiPulse />
            <CapabilityBody cap={apis} />
          </article>

          {/* Chatbots — wide footer tile */}
          <article
            className={cn(tileBase, "min-h-[12rem] sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8")}
          >
            <TopHighlight />
            <CapabilityBody cap={chatbots} />
            <div className="mt-6 flex items-center gap-4 lg:mt-0 lg:shrink-0">
              <div className="flex items-center gap-2 rounded-full bg-base px-4 py-2.5 ring-1 ring-white/[0.06]">
                <TypingDots />
              </div>
              <span className="font-mono text-xs text-ink-dim">deploys in minutes</span>
            </div>
          </article>
        </ClipReveal>
      </div>
    </section>
  );
}
