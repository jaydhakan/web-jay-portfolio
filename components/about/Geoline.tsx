"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import type { TimelineEntry } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * The "geoline" (V3 Phase 2 / E3) — the career timeline as a SERPENTINE ROAD you
 * travel by scrolling DOWN. A tall SVG path winds left→right→left as it descends;
 * as you scroll, the road DRAWS (DrawSVG, scrubbed to natural page scroll), a glowing
 * comet (head + trailing tail) rides the draw's leading edge banking into each turn, a
 * faint "current" of dashes flows along it, milestone nodes pop with a leader line out
 * to their card, and glassy cards reveal on the outer side of each bend as the comet
 * reaches them. Same indigo→violet→cyan glow family as the LatentField (pure SVG/CSS —
 * no 2nd canvas, and NO blur filters so it stays cheap over the live field).
 *
 * Coordinate trick: a fixed viewBox `0 0 100 VBH` + a container whose CSS aspect-ratio
 * equals 100/VBH (md+ only), so a road point (x, y) maps to container % (x%, y/VBH*100%)
 * — cards land on the bends with zero JS measurement and CLS = 0.
 *
 * A11y / R7: the cards are ONE real, readable <ol> (the SVG road is aria-hidden). The
 * cards ship VISIBLE; on desktop CSS places them on the bends and GSAP sets the hidden
 * start ONLY under (min-width:768px) + no-preference. Mobile = a clean stacked list;
 * RM / no-JS = full static road + visible cards (comet motion-reduce:hidden; the flow
 * dash is motion-safe). Card placement is pure CSS (not gsap.set), so it's correct from
 * first paint even before the lazy DrawSVG chunk arms — no flash, no shift.
 */

const VBW = 100;
const PAD = 22; // top/bottom margin (viewBox units) — keeps node 0 clear of the heading
const SEG = 32; // vertical gap between milestones (steeper = more road-like)
const LX = 20; // left lane
const RX = 80; // right lane (swing = 60% of width)
const TAIL = 3; // comet trail segments
const LEAD = 32; // node→card leader-line length (viewBox units)

type Pt = { x: number; y: number };

/** Serpentine waypoints: alternate lane each row, y descends linearly. */
function waypoints(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: i % 2 === 0 ? LX : RX,
    y: PAD + i * SEG,
  }));
}

/** Vertical-dominant Catmull-Rom → cubic bezier (smooth switchbacks; nodes ON curve). */
function serpentinePath(p: Pt[]): string {
  if (p.length < 2) return "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * 1.15; // round the turns
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * 1.15;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function Geoline({ entries }: { entries: TimelineEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const tailRefs = useRef<(SVGCircleElement | null)[]>([]);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ready = useExtraPlugins(); // DrawSVG lives in the lazy chunk

  const n = entries.length;
  const VBH = PAD * 2 + (n - 1) * SEG;
  const pts = useMemo(() => waypoints(n), [n]);
  const d = useMemo(() => serpentinePath(pts), [pts]);
  const start = pts[0] ?? { x: LX, y: PAD };

  useGSAP(
    () => {
      if (!ready) return; // re-runs when the DrawSVG chunk resolves
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const line = lineRef.current;
        if (!line) return;
        const total = line.getTotalLength(); // cached once (NEVER per frame)
        const draws = [glowRef.current, line].filter(Boolean) as SVGPathElement[];
        const tails = tailRefs.current.filter(Boolean) as SVGCircleElement[];
        const nodes = nodeRefs.current.filter(Boolean) as SVGGElement[];
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

        // Arc-length fraction of each waypoint: bisect the length whose point.y == the
        // node's y (the spline's segments are uneven). y is monotonic along the road,
        // and this fraction is BOTH where the comet is and when the node/card fires —
        // so the comet, the draw front, and the reveal stay locked together.
        const nodeFrac = pts.map((p) => {
          let lo = 0;
          let hi = total;
          for (let k = 0; k < 18; k++) {
            const mid = (lo + hi) / 2;
            if (line.getPointAtLength(mid).y < p.y) lo = mid;
            else hi = mid;
          }
          return lo / total;
        });

        // Comet rides the SAME normalized clock as the draw (both span timeline 0→1),
        // so the head sits exactly at the drawn leading edge instead of lagging it.
        const head = { len: 0 };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            end: "bottom 65%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        tl.fromTo(draws, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0);
        tl.to(
          head,
          {
            len: total,
            duration: 1,
            ease: "none",
            onUpdate: () => {
              const a = line.getPointAtLength(head.len);
              const b = line.getPointAtLength(Math.min(head.len + 1, total));
              const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
              headRef.current?.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${ang})`);
              tails.forEach((c, i) => {
                const t = line.getPointAtLength(Math.max(head.len - (i + 1) * total * 0.025, 0));
                c.setAttribute("cx", String(t.x));
                c.setAttribute("cy", String(t.y));
              });
            },
          },
          0,
        );
        nodes.forEach((node, i) =>
          tl.fromTo(
            node,
            { scale: 0, autoAlpha: 0, transformOrigin: "center" },
            { scale: 1, autoAlpha: 1, duration: 0.1, ease: "back.out(2)" },
            nodeFrac[i],
          ),
        );
        // Cards are placed on the bends by CSS (md:absolute). GSAP only sets the hidden
        // start + reveal; yPercent:-50 preserves the CSS vertical centering.
        cards.forEach((card, i) =>
          tl.fromTo(
            card,
            { autoAlpha: 0, yPercent: -50, y: 24 },
            { autoAlpha: 1, yPercent: -50, y: 0, duration: 0.14, ease: "expo.out" },
            nodeFrac[i],
          ),
        );
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <div ref={rootRef} className="relative mt-12">
      {/* Aspect-locked box: aspect-ratio only on md+ (reserves the road height, CLS=0);
          on mobile it sizes to the stacked list. */}
      <div
        className="relative mx-auto w-full max-w-[920px] md:[aspect-ratio:var(--geo-aspect)]"
        style={{ ["--geo-aspect" as string]: `${VBW} / ${VBH}` }}
      >
        {/* THE ROAD — desktop only, decorative. Ships FULLY DRAWN (no drawSVG:0% in markup).
            No blur filters: glow = a wide low-opacity stroke under the sharp line + fake
            halos, so it stays cheap over the live page-wide WebGL field. */}
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          className="absolute inset-0 hidden size-full overflow-visible md:block"
          fill="none"
        >
          <defs>
            <linearGradient id="geo-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="55%" stopColor="var(--color-accent-violet)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
          </defs>

          {/* Faint full trajectory (always hints the road's shape). */}
          <path d={d} stroke="var(--color-line)" strokeWidth={0.8} strokeLinecap="round" />
          {/* Wide soft glow + sharp line (both DrawSVG-scrubbed together). */}
          <path ref={glowRef} d={d} stroke="url(#geo-stroke)" strokeWidth={3.6} strokeLinecap="round" opacity={0.32} />
          <path ref={lineRef} d={d} stroke="url(#geo-stroke)" strokeWidth={1.7} strokeLinecap="round" />
          {/* Always-on flowing "current" — a separate path (never DrawSVG'd); motion-safe
              so reduced-motion shows it as static dashes. */}
          <path
            d={d}
            stroke="url(#geo-stroke)"
            strokeWidth={1.0}
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity={0.9}
            className="motion-safe:[animation:geo-flow_4s_linear_infinite]"
          />

          {/* Waypoint nodes ON the curve, each with a leader line out to its card. */}
          {pts.map((p, i) => (
            <g
              key={entries[i]?.title ?? i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
            >
              {/* Leader line toward the card (grows out of the node as it pops). */}
              <line
                x1={0}
                y1={0}
                x2={i % 2 === 0 ? LEAD : -LEAD}
                y2={0}
                stroke="var(--color-accent)"
                strokeWidth={0.5}
                strokeDasharray="1.5 1.5"
                opacity={0.5}
              />
              <circle r={2.8} fill="var(--color-accent)" opacity={0.16} />
              <circle r={1.3} fill="var(--color-base)" stroke="var(--color-accent)" strokeWidth={0.6} />
            </g>
          ))}

          {/* Comet: glowing head (banks into turns) + fading trailing tail. No filters. */}
          <g className="motion-reduce:hidden">
            {Array.from({ length: TAIL }, (_, i) => (
              <circle
                key={`tail-${i}`}
                ref={(el) => {
                  tailRefs.current[i] = el;
                }}
                cx={start.x}
                cy={start.y}
                r={Math.max(0.9 - i * 0.2, 0.35)}
                fill="var(--color-accent-cyan)"
                opacity={0.5 / (i + 1)}
              />
            ))}
            <g ref={headRef} transform={`translate(${start.x} ${start.y})`}>
              <circle r={3.2} fill="var(--color-accent-cyan)" opacity={0.16} />
              <circle r={1.6} fill="var(--color-accent-cyan)" opacity={0.4} />
              <circle r={1.0} fill="var(--color-accent-cyan)" />
            </g>
          </g>
        </svg>

        {/* SINGLE accessible <ol>. Stacked flow by default (mobile / RM / no-JS); on md+
            CSS places each card on the OUTER side of its bend (no JS measurement). */}
        <ol className="space-y-4 md:space-y-0">
          {entries.map((entry, i) => {
            const leftLane = i % 2 === 0; // node on the left → card in the right gutter
            return (
              <li
                key={entry.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{ top: `${(pts[i].y / VBH) * 100}%` }}
                className={cn(
                  // Hover affordance is border+bg only (NOT transform): GSAP owns the
                  // transform for centering/reveal. Solid-ish tint (no backdrop-blur) keeps
                  // text readable over the live field without per-frame blur cost.
                  "group rounded-2xl border border-line bg-base/80 p-5 transition-colors duration-300 ease-out hover:border-accent/45 hover:bg-elevated/80",
                  "md:absolute md:max-w-[42%] md:-translate-y-1/2",
                  leftLane ? "md:left-[54%] md:right-0" : "md:left-0 md:right-[54%]",
                )}
              >
                <p className="font-mono text-xs tabular-nums text-accent">{entry.period}</p>
                <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-ink">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{entry.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
