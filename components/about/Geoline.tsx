"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import type { TimelineEntry } from "@/data/content";

/**
 * The "geoline" (V3 Phase 2 / E3) — the career timeline reimagined as a literal
 * optimization run: a loss curve descending left→right (NOT a straight rule), drawn
 * as an annotated chart. On scroll it DRAWS (DrawSVG, scrubbed) with a neon glow +
 * a gradient area-fill deepening underneath; a comet marker (head + trailing tail)
 * GLIDES along the real curve via getPointAtLength; year ticks sit on the time axis
 * and each milestone is a waypoint that pops + reveals its card as the draw reaches
 * it (cards lift on hover). Same particle-family indigo→violet→cyan ramp + glow so
 * it reads as one language with the LatentField.
 *
 * A11y / R7: the cards + axis ship VISIBLE in real DOM (the readable timeline); GSAP
 * only sets the hidden start under desktop + no-preference, so reduced motion / no-JS
 * see the full static chart + entries. Mobile = a clean vertical list (the chart is a
 * desktop enhancement). The whole SVG is decorative (aria-hidden).
 */

const W = 1200;
const H = 480;
const L = 95; // plot left
const R = 1140; // plot right
const TOP = 110; // high loss
const BOT = 380; // converged
const AXIS = 412; // x-axis line / year-tick row
const GRID = [150, 215, 280, 345];
const TAIL = 3; // comet trail segments

type Pt = { x: number; y: number };

/** Waypoint coords: evenly spaced in x, descending in y with a gentle arc. */
function waypoints(n: number): Pt[] {
  const span = R - L;
  return Array.from({ length: n }, (_, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const arc = Math.sin(t * Math.PI) * -26; // dips the descent so it isn't linear
    return { x: L + t * span, y: TOP + (BOT - TOP) * t + arc };
  });
}

/** Catmull-Rom → cubic-bezier path through the points (so dots sit ON the curve). */
function smoothPath(p: Pt[]): string {
  if (p.length < 2) return "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Short year tick for the time axis ("2024-2025" -> "2024"). */
const yearOf = (period: string) => period.split(/[-–—]/)[0].trim();

export function Geoline({ entries }: { entries: TimelineEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);
  const yearRefs = useRef<(SVGTextElement | null)[]>([]);
  const cometRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ready = useExtraPlugins(); // DrawSVG lives in the lazy chunk

  const pts = useMemo(() => waypoints(entries.length), [entries.length]);
  const lineD = useMemo(() => smoothPath(pts), [pts]);
  const fillD = useMemo(() => {
    if (pts.length < 2) return "";
    const tail = smoothPath(pts).replace(/^M[^C]*/, ""); // the "C ..." commands
    const a = pts[0];
    const b = pts[pts.length - 1];
    return `M ${a.x} ${AXIS} L ${a.x} ${a.y} ${tail} L ${b.x} ${AXIS} Z`;
  }, [pts]);
  const start = pts[0] ?? { x: L, y: TOP };

  useGSAP(
    () => {
      if (!ready) return; // re-runs when the DrawSVG chunk resolves
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const line = lineRef.current;
        const glow = glowRef.current;
        if (!line) return;
        const total = line.getTotalLength();
        const dots = dotRefs.current.filter(Boolean) as SVGGElement[];
        const years = yearRefs.current.filter(Boolean) as SVGTextElement[];
        const comets = cometRefs.current.filter(Boolean) as SVGCircleElement[];
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
        const n = Math.max(dots.length - 1, 1);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 72%",
            end: "bottom 78%",
            scrub: true,
            onUpdate: (self) => {
              // Comet head + trailing tail glide along the actual drawn curve.
              comets.forEach((c, i) => {
                const len = Math.max(self.progress * total - i * (total * 0.018), 0);
                const pt = line.getPointAtLength(len);
                c.setAttribute("cx", String(pt.x));
                c.setAttribute("cy", String(pt.y));
              });
            },
          },
        });

        tl.fromTo([glow, line].filter(Boolean), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0);
        if (fillRef.current) tl.fromTo(fillRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: "none" }, 0);

        dots.forEach((dot, i) => {
          const f = (i / n) * 0.92;
          tl.fromTo(dot, { scale: 0, transformOrigin: "center", autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.12, ease: "back.out(2)" }, f);
          if (years[i]) tl.fromTo(years[i], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: "expo.out" }, f);
        });
        cards.forEach((card, i) => {
          const f = (i / n) * 0.92;
          tl.fromTo(card, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: "expo.out" }, f);
        });
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <div ref={rootRef} className="relative mt-12">
      {/* Desktop: the annotated loss-chart. */}
      <div aria-hidden className="relative hidden w-full md:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 size-full overflow-visible"
          fill="none"
        >
          <defs>
            <filter id="geo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <linearGradient id="geo-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="55%" stopColor="var(--color-accent-violet)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
            <linearGradient id="geo-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Chart frame: faint grid + axes (the "loss vs. time" backdrop). */}
          <g stroke="var(--color-line)" strokeWidth={1}>
            {GRID.map((y) => (
              <line key={y} x1={L} y1={y} x2={R} y2={y} opacity={0.45} />
            ))}
            <line x1={L} y1={TOP - 24} x2={L} y2={AXIS} opacity={0.7} />
            <line x1={L} y1={AXIS} x2={R} y2={AXIS} opacity={0.7} />
          </g>
          <g className="font-mono" fill="var(--color-ink-dim)" style={{ fontSize: 13, letterSpacing: "0.18em" }}>
            <text x={L - 16} y={(TOP + BOT) / 2} textAnchor="middle" transform={`rotate(-90 ${L - 16} ${(TOP + BOT) / 2})`} opacity={0.8}>
              LOSS
            </text>
            <text x={L + 4} y={TOP - 10} opacity={0.55} style={{ fontSize: 11 }}>high</text>
            <text x={R} y={AXIS + 44} textAnchor="end" opacity={0.8}>TIME →</text>
            <text x={R} y={TOP - 10} textAnchor="end" fill="var(--color-accent-cyan)" opacity={0.85} style={{ fontSize: 11 }}>
              ↓ converged
            </text>
          </g>

          {/* Area fill under the curve. */}
          <path ref={fillRef} d={fillD} fill="url(#geo-fill)" />

          {/* Faint full trajectory + the neon glow + sharp drawn line. */}
          <path d={lineD} stroke="var(--color-line)" strokeWidth={2} strokeLinecap="round" />
          <path ref={glowRef} d={lineD} stroke="url(#geo-stroke)" strokeWidth={7} strokeLinecap="round" opacity={0.5} filter="url(#geo-glow)" />
          <path ref={lineRef} d={lineD} stroke="url(#geo-stroke)" strokeWidth={3.5} strokeLinecap="round" />

          {/* Year ticks on the time axis. */}
          {pts.map((p, i) => (
            <text
              key={`yr-${entries[i]?.title ?? i}`}
              ref={(el) => {
                yearRefs.current[i] = el;
              }}
              x={p.x}
              y={AXIS + 26}
              textAnchor="middle"
              className="font-mono"
              fill="var(--color-ink-dim)"
              style={{ fontSize: 13 }}
            >
              {yearOf(entries[i]?.period ?? "")}
            </text>
          ))}

          {/* Waypoint nodes ON the curve. */}
          {pts.map((p, i) => (
            <g
              key={entries[i]?.title ?? i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
            >
              <circle r={12} fill="var(--color-accent)" opacity={0.18} filter="url(#geo-glow)" />
              <circle r={6} fill="var(--color-base)" stroke="var(--color-accent)" strokeWidth={2.5} />
            </g>
          ))}

          {/* Comet marker: a glowing head + a fading trail (the optimizer stepping). */}
          <g className="motion-reduce:hidden">
            {Array.from({ length: TAIL + 1 }, (_, i) => (
              <circle
                key={`comet-${i}`}
                ref={(el) => {
                  cometRefs.current[i] = el;
                }}
                cx={start.x}
                cy={start.y}
                r={i === 0 ? 5 : 4 - i * 0.6}
                fill="var(--color-accent-cyan)"
                opacity={i === 0 ? 1 : 0.4 / i}
                filter={i === 0 ? "url(#geo-glow)" : undefined}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Milestones: real DOM, readable with zero JS. Vertical on mobile, a grid on
          desktop; each pops in sequence as the curve draws past it. */}
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map((entry, i) => (
          <li
            key={entry.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="group rounded-2xl border border-line bg-base/55 p-5 backdrop-blur-md transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-accent/45"
          >
            <p className="font-mono text-xs tabular-nums text-accent">{entry.period}</p>
            <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-ink">
              {entry.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{entry.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
