import { SectionLabel } from "@/components/ui/SectionLabel";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { LineDraw } from "@/components/motion/LineDraw";
import { hash01 } from "@/components/timeline/geometry";

type Epoch = { tag: string; title: string; body: string };

/**
 * "The Training Signal" (plan.md Phase 6). The old WebGL camera-flight is fully
 * retired (TrainingRunCanvas deleted); the narrative stays authoritative DOM — but the
 * section now carries its thesis visually: a LOSS CURVE drawn across the top, violent
 * and noisy at epoch one, converging to a needle by the last. Pure deterministic SVG
 * (SSR-stable via hash01), stroke-drawn on scroll via LineDraw (reduced motion / no-JS
 * see it fully drawn). Epoch markers sit on the curve, one per card below.
 *
 * Cards are near-opaque — NO backdrop-blur over the page-wide canvas (hard gate).
 */

const N = 110;

function lossY(t: number, i: number): number {
  const decay = 3.4 + 14.5 * Math.exp(-2.7 * t);
  const noise = (hash01(`ts.${i}`) - 0.5) * 9 * Math.max(0.06, Math.exp(-2.2 * t));
  return decay + noise;
}

function buildCurve(epochCount: number) {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    pts.push(`${i === 0 ? "M" : "L"} ${(t * 100).toFixed(2)} ${lossY(t, i).toFixed(2)}`);
  }
  const markers = Array.from({ length: epochCount }, (_, k) => {
    const t = epochCount === 1 ? 1 : (k + 0.5) / epochCount;
    const i = Math.round(t * (N - 1));
    return { x: t * 100, y: lossY(t, i) };
  });
  return { d: pts.join(" "), markers };
}

export function TrainingRun({
  eyebrow,
  heading,
  epochs,
}: {
  eyebrow: string;
  heading: string;
  epochs: Epoch[];
}) {
  const { d, markers } = buildCurve(epochs.length);

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
        {heading}
      </h2>

      {/* The loss curve — the section's thesis as a drawing: chaos converging to a
          needle. Drawn by scroll (LineDraw); static-full under reduced motion. */}
      <LineDraw viewBox="0 0 100 24" scrub className="mt-12 h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="ts-stroke" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="55%" stopColor="var(--color-accent-violet)" />
            <stop offset="100%" stopColor="var(--color-accent-cyan)" />
          </linearGradient>
        </defs>
        {/* faint converged-target rule */}
        <line x1="0" y1="3.4" x2="100" y2="3.4" stroke="var(--color-line)" strokeWidth="0.14" strokeDasharray="0.9 1.6" />
        <path
          data-draw
          d={d}
          stroke="url(#ts-stroke)"
          strokeWidth="0.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {markers.map((m, k) => (
          <g key={k} transform={`translate(${m.x} ${m.y})`}>
            <circle r="0.9" fill="none" stroke="var(--color-accent-cyan)" strokeWidth="0.18" opacity="0.5" />
            <circle r="0.38" fill="var(--color-accent-cyan)" />
          </g>
        ))}
      </LineDraw>

      <ClipReveal
        as="ol"
        stagger={0.1}
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {epochs.map((epoch) => (
          <li
            key={epoch.tag}
            className="group rounded-2xl border border-line bg-base/85 p-7 transition-colors duration-300 hover:border-accent/40"
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
