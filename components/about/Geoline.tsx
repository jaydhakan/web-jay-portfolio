"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import type { TimelineEntry } from "@/data/content";

/**
 * The "geoline" (V3 Phase 2 / E3) — the career timeline reimagined as a CURVED,
 * interactive optimization trajectory instead of a straight rule. A wide SVG path
 * descends + gently arcs left→right like a loss curve; it DRAWS as you scroll
 * (DrawSVG, scrubbed), a glow marker GLIDES along the real curve, and each career
 * entry is a waypoint node ON the path that pops + reveals its card as the draw
 * reaches it (and lifts on hover). Same particle-family accent + glow so it reads
 * as one language with the LatentField.
 *
 * A11y / R7: the cards + waypoints ship VISIBLE in real DOM (the readable timeline);
 * GSAP only sets the hidden start state under desktop + no-preference, so reduced
 * motion / no-JS see the full static curve + entries. Mobile gets a clean vertical
 * list (the curve is a desktop enhancement). The SVG is decorative (aria-hidden).
 */

const W = 1000;
const H = 440;
const MX = 70; // horizontal margin
const TOP = 130; // high loss
const BOT = 350; // converged

type Pt = { x: number; y: number };

/** Waypoint coords: evenly spaced in x, descending in y with a gentle arc. */
function waypoints(n: number): Pt[] {
  const span = W - MX * 2;
  return Array.from({ length: n }, (_, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const arc = Math.sin(t * Math.PI) * -30; // dips the descent so it isn't linear
    return { x: MX + t * span, y: TOP + (BOT - TOP) * t + arc };
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

export function Geoline({ entries }: { entries: TimelineEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ready = useExtraPlugins(); // DrawSVG lives in the lazy chunk

  const pts = useMemo(() => waypoints(entries.length), [entries.length]);
  const d = useMemo(() => smoothPath(pts), [pts]);
  const start = pts[0] ?? { x: MX, y: TOP };

  useGSAP(
    () => {
      if (!ready) return; // re-runs when the DrawSVG chunk resolves
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const path = pathRef.current;
        const marker = markerRef.current;
        if (!path) return;
        const total = path.getTotalLength();
        const dots = dotRefs.current.filter(Boolean) as SVGGElement[];
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 72%",
            end: "bottom 75%",
            scrub: true,
            onUpdate: (self) => {
              if (!marker) return;
              const pt = path.getPointAtLength(self.progress * total);
              marker.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
            },
          },
        });

        // The path draws across the whole scrub; waypoints + cards resolve at their
        // fraction of the trajectory (so they appear "as the draw reaches them").
        tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0);
        const n = Math.max(dots.length - 1, 1);
        dots.forEach((dot, i) => {
          const f = (i / n) * 0.92;
          tl.fromTo(
            dot,
            { scale: 0, transformOrigin: "center", autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.12, ease: "back.out(2)" },
            f,
          );
        });
        cards.forEach((card, i) => {
          const f = (i / n) * 0.92;
          tl.fromTo(
            card,
            { autoAlpha: 0, y: 22 },
            { autoAlpha: 1, y: 0, duration: 0.18, ease: "expo.out" },
            f,
          );
        });
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <div ref={rootRef} className="relative mt-12">
      {/* Desktop: the curved trajectory + waypoint nodes. */}
      <div aria-hidden className="relative hidden w-full md:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 size-full overflow-visible text-accent"
          fill="none"
        >
          <defs>
            <filter id="geo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <linearGradient id="geo-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="55%" stopColor="var(--color-accent-violet)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
          </defs>

          {/* Faint full trajectory behind the drawn accent line. */}
          <path d={d} stroke="var(--color-line)" strokeWidth={2} strokeLinecap="round" />
          {/* The drawn accent line (DrawSVG scrubs this on desktop + motion). */}
          <path
            ref={pathRef}
            d={d}
            stroke="url(#geo-stroke)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Waypoint nodes ON the curve. */}
          {pts.map((p, i) => (
            <g
              key={entries[i]?.title ?? i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
            >
              <circle r={11} fill="var(--color-accent)" opacity={0.18} filter="url(#geo-glow)" />
              <circle r={5.5} fill="var(--color-base)" stroke="var(--color-accent)" strokeWidth={2.5} />
            </g>
          ))}

          {/* Gliding glow marker (the optimizer stepping along the curve). */}
          <g
            ref={markerRef}
            transform={`translate(${start.x} ${start.y})`}
            className="motion-reduce:hidden"
          >
            <circle r={13} fill="var(--color-accent-cyan)" opacity={0.4} filter="url(#geo-glow)" />
            <circle r={4} fill="var(--color-accent-cyan)" />
          </g>
        </svg>
      </div>

      {/* The entries: a horizontal row aligned under the waypoints on desktop, a
          clean vertical list on mobile. Real DOM, readable with zero JS. */}
      <ol className="mt-6 grid gap-5 md:grid-cols-5">
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
