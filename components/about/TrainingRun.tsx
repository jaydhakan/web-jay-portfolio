import { SectionLabel } from "@/components/ui/SectionLabel";
import { ClipReveal } from "@/components/motion/ClipReveal";

type Epoch = { tag: string; title: string; body: string };

/**
 * "The training run" (V3 P10 → Phase 2 E3). Originally a pinned full-bleed WebGL
 * camera-flight through a knowledge graph; that dedicated canvas is **retired** so
 * /about runs exactly ONE governed canvas — the page-wide `LatentField` (mounted in
 * app/about/page.tsx), whose curl-noise flow IS the "molecule flight" look now. This
 * section keeps the narrative as authoritative DOM: the epochs read as the model's
 * loss descending, in translucent cards that let the field glow through behind them.
 * (TrainingRunCanvas.tsx is kept in the repo for reuse.)
 */
export function TrainingRun({
  eyebrow,
  heading,
  epochs,
}: {
  eyebrow: string;
  heading: string;
  epochs: Epoch[];
}) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
        {heading}
      </h2>

      <ClipReveal
        as="ol"
        stagger={0.1}
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {epochs.map((epoch) => (
          <li
            key={epoch.tag}
            className="group rounded-2xl border border-line bg-base/55 p-7 backdrop-blur-md transition-colors duration-300 hover:border-accent/40"
          >
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
              {epoch.tag}
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold text-ink">{epoch.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{epoch.body}</p>
          </li>
        ))}
      </ClipReveal>
    </section>
  );
}
