"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * SerpentineTimeline (Phase 4, "Synapse") — the ONE timeline engine, shared by the
 * /about journey and the /work shipped-systems list. A bold neural dendrite swings
 * FULL-LEFT to FULL-RIGHT down the page (the deliberate opposite of the rejected
 * vertical meridian), with an iridescent synaptic bloom clustered at every wide bend.
 * As you scroll, a white-hot charge ORB races down the wire (banking into each turn,
 * trailing a short cyan comet streak); each SYNAPSE charges then FIRES (hollow indigo
 * bead -> cyan core + one-shot radar ping + bloom brighten) the instant the charge
 * arrives, a dendritic STEM draws out to its card, and the card reveals on the SAME
 * arc-length clock. Fired synapses stay lit behind the orb, so at any scroll position
 * you see a half-awakened network with a bright frontier: you are watching it wake up.
 *
 * The component is CONTENT-AGNOSTIC: it owns geometry, the SVG, the single scrubbed
 * timeline, the live counter, the accessible <ol> wrapper and the mobile rail; the
 * <li> CONTENT comes from the `renderCard` render-prop, so /about (text milestones)
 * and /work (clickable project cards + filter spotlight) differ ONLY in data mapping.
 *
 * Hard gates (DESIGN.md): CLS=0 via the proven fixed-viewBox + container aspect-ratio
 * trick (zero JS measurement); exactly ONE scrubbed ScrollTrigger; glow = stacked
 * low-opacity SVG strokes + pre-rendered radial blooms (NEVER blur over the live
 * page-wide LatentField WebGL); scroll motion = transform / opacity / drawSVG /
 * SVG-attr / one CSS var only (no box-shadow or layout tween on scroll); no per-frame
 * React (active index updates only when the integer changes). Reduced-motion / no-JS
 * ship a complete, fully-lit static dendrite; below md the swing collapses to a clean
 * left-rail stacked list.
 */

// ── Geometry ─────────────────────────────────────────────────────────────────
const VBW = 100;
const CX = 50; // chart centre lane
const AMP = 32; // swing amplitude -> nodes at x = 18 (full left) / 82 (full right)
const PAD = 28; // top/bottom clearance
const SEG = 34; // vertical pitch per synapse
const K = 0.5; // bezier vertical-handle factor -> smooth bold sine wave, monotonic y

// Card lane edges (container %). Card sits on the OPPOSITE side of its wall-node, in
// the calm central band; a dotted tether leads from the bend in to the card edge.
const LANE = {
  left: { className: "md:left-[6%] md:right-[48%]", edge: 52 }, // card LEFT, right edge ~52%
  right: { className: "md:left-[48%] md:right-[6%]", edge: 48 }, // card RIGHT, left edge ~48%
} as const;

type Pt = { x: number; y: number };

/** Pure, SSR-stable waypoints: x = CX + AMP*cos(i*PI) -> 82,18,82,18,... (full
 *  alternation, no node ever sits centre). y strictly monotonic (load-bearing). */
function waypoints(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: CX + AMP * Math.cos(i * Math.PI),
    y: PAD + i * SEG,
  }));
}

/** Cubic spline through the waypoints with vertical-dominant handles: the curve
 *  leaves/enters each node vertically and bows boldly to the opposite wall — a smooth
 *  serpentine ROAD, not zig-zag teeth. Control y stay between segment endpoints, so
 *  y(t) is strictly monotonic and the orb's arc-length->node bisection is provably safe
 *  even though x reverses at every bend. */
function serpentinePath(p: Pt[]): string {
  if (p.length === 0) return "";
  if (p.length === 1) return `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const dy = b.y - a.y;
    d += ` C ${a.x.toFixed(2)} ${(a.y + dy * K).toFixed(2)} ${b.x.toFixed(2)} ${(b.y - dy * K).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return d;
}

/** even i -> node at full RIGHT -> card on the LEFT; odd i -> node LEFT -> card RIGHT. */
function sideFor(i: number): "left" | "right" {
  return i % 2 === 0 ? "left" : "right";
}

export type RenderCard = (
  i: number,
  side: "left" | "right",
  isActive: boolean,
) => ReactNode;

export function SerpentineTimeline({
  count,
  renderCard,
  hudLabel,
  dimmed,
  className,
}: {
  /** Number of milestones/systems (drives waypoints, VBH, aspect-ratio). */
  count: number;
  /** Supplies the <li> body for milestone i (engine owns placement + reveal + active). */
  renderCard: RenderCard;
  /** Live-counter label, e.g. "NODES LIVE" (/about) or "SYSTEMS LIVE" (/work). */
  hudLabel: string;
  /** Optional filter spotlight: return true to dim milestone i (no reflow). */
  dimmed?: (i: number) => boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const orbRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const stemRefs = useRef<(SVGPathElement | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const ready = useExtraPlugins(); // DrawSVG lives in the lazy chunk

  const [active, setActive] = useState(-1); // no card singled out in the static/RM state
  const lastCount = useRef(0);

  const n = count;
  const VBH = PAD * 2 + Math.max(0, n - 1) * SEG;
  const pts = useMemo(() => waypoints(n), [n]);
  const d = useMemo(() => serpentinePath(pts), [pts]);
  const start = pts[0] ?? { x: CX + AMP, y: PAD };

  useGSAP(
    () => {
      if (!ready) return; // re-runs when the DrawSVG chunk resolves
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const core = coreRef.current;
        const halo = haloRef.current;
        const orb = orbRef.current;
        if (!core || !halo) return;

        const total = core.getTotalLength(); // cached ONCE, never per frame
        const nodes = nodeRefs.current.filter(Boolean) as SVGGElement[];
        const stems = stemRefs.current.filter(Boolean) as SVGPathElement[];
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

        // Arc-length fraction where the path reaches each node's y (bisection — safe
        // because y is strictly monotonic). This single array is BOTH where the orb is
        // AND when each synapse fires + card reveals: one clock for everything.
        const nodeFrac = pts.map((p) => {
          let lo = 0;
          let hi = total;
          for (let k = 0; k < 18; k++) {
            const mid = (lo + hi) / 2;
            if (core.getPointAtLength(mid).y < p.y) lo = mid;
            else hi = mid;
          }
          return lo / total;
        });

        // Idle starting state (markup ships the LIT/arrived state for RM/no-JS, so we
        // reset to dormant here, only under the matched query).
        gsap.set([halo, core], { drawSVG: "0%" });
        nodes.forEach((node) => {
          gsap.set(node.querySelector(".syn-core"), {
            attr: { fill: "var(--color-base)", stroke: "var(--color-accent)" },
          });
          gsap.set(node.querySelector(".syn-bloom"), { opacity: 0.12, scale: 1, transformOrigin: "center" });
          gsap.set(node.querySelector(".syn-halo"), { opacity: 0, scale: 1, transformOrigin: "center" });
          gsap.set(node.querySelector(".syn-ping"), { opacity: 0, scale: 1, transformOrigin: "center" });
        });
        gsap.set(stems, { drawSVG: "0%", opacity: 0 });
        gsap.set(cards, { autoAlpha: 0 });
        if (orb) gsap.set(orb, { opacity: 0 });
        if (barRef.current) gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left center" });
        // Counter ships its final "n / n" for RM/no-JS; reset it to dormant here.
        lastCount.current = 0;
        if (countRef.current) countRef.current.textContent = "00";

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 74%",
            end: "bottom 58%",
            scrub: 1, // ~1s catch-up -> the orb glides instead of snapping 1:1
            invalidateOnRefresh: true,
          },
        });

        // 1) Draw the wire — wide soft halo + sharp core together (no lag).
        tl.fromTo([halo, core], { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0);

        // 2) Orb on the SAME 0->1 clock: 2 getPointAtLength (position + heading) + 1
        //    setAttribute/frame. It banks into turns so the comet streak trails along
        //    the local tangent even though x is non-monotonic.
        if (orb) {
          const head = { len: 0 };
          tl.set(orb, { opacity: 1 }, 0);
          tl.to(
            head,
            {
              len: total,
              duration: 1,
              ease: "none",
              onUpdate: () => {
                const a = core.getPointAtLength(head.len);
                const b = core.getPointAtLength(Math.min(total, head.len + 1));
                const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
                orb.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${deg})`);
              },
            },
            0,
          );
        }

        // 3) Per synapse — ignite as the charge arrives (the bead is already plotted, it
        //    LIGHTS; never a pop from nothing). One-shot ping (single tween, never a
        //    looping keyframe over the WebGL field).
        nodes.forEach((node, i) => {
          const at = nodeFrac[i];
          tl.to(
            node.querySelector(".syn-core"),
            { attr: { fill: "var(--color-accent-cyan)", stroke: "var(--color-accent-cyan)" }, duration: 0.05, ease: "none" },
            at,
          );
          tl.to(node.querySelector(".syn-bloom"), { opacity: 0.42, scale: 1.5, duration: 0.12, ease: "back.out(2)" }, at);
          tl.fromTo(
            node.querySelector(".syn-halo"),
            { opacity: 0.32, scale: 1 },
            { opacity: 0, scale: 1.9, duration: 0.12, ease: "back.out(2)" },
            at,
          );
          tl.fromTo(
            node.querySelector(".syn-ping"),
            { opacity: 0.7, scale: 1 },
            { opacity: 0, scale: 3.2, duration: 0.2, ease: "power2.out" },
            at,
          );
        });

        // 4) Dendritic stem draws out to the card on arrival.
        stems.forEach((s, i) =>
          tl.fromTo(s, { drawSVG: "0%", opacity: 0 }, { drawSVG: "100%", opacity: 0.55, duration: 0.1, ease: "power2.out" }, nodeFrac[i]),
        );

        // 5) Card reveal — yPercent:-50 preserves the CSS -translate-y-1/2 centering; the
        //    card also slides in from its bend side. Enter = expo.out, no scale.
        cards.forEach((card, i) => {
          const fromX = sideFor(i) === "left" ? -16 : 16;
          tl.fromTo(
            card,
            { autoAlpha: 0, yPercent: -50, y: 18, x: fromX },
            { autoAlpha: 1, yPercent: -50, y: 0, x: 0, duration: 0.16, ease: "expo.out" },
            nodeFrac[i],
          );
        });

        // 6) HUD + active glow, all in ONE onUpdate. The progress bar reads a per-frame
        //    scaleX (compositor-only); the integer counter + active index update ONLY
        //    when the count changes (no per-frame React, no per-frame textContent).
        tl.eventCallback("onUpdate", () => {
          const p = tl.progress();
          if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(3)})`;
          let lit = 0;
          for (let i = 0; i < nodeFrac.length; i++) if (p >= nodeFrac[i] - 0.004) lit++;
          if (lit !== lastCount.current) {
            lastCount.current = lit;
            if (countRef.current) countRef.current.textContent = String(lit).padStart(2, "0");
            setActive(Math.max(0, lit - 1));
          }
        });
      });
    },
    { scope: rootRef, dependencies: [ready, n] },
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Live counter (gamified, aria-hidden ambient flavour). Sticks under the navbar
          as you scroll the tall timeline. Ships its final state for RM/no-JS. */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-20 z-20 mb-6 hidden justify-end md:flex"
      >
        <div className="flex items-center gap-3 rounded-full border border-line bg-base/70 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">{hudLabel}</span>
          <span className="font-mono text-xs tabular-nums text-accent-cyan">
            <span ref={countRef}>{String(n).padStart(2, "0")}</span>
            <span className="text-ink-dim"> / {String(n).padStart(2, "0")}</span>
          </span>
          <span className="relative h-1 w-16 overflow-hidden rounded-full bg-line">
            <span
              ref={barRef}
              className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent via-accent-violet to-accent-cyan"
            />
          </span>
        </div>
      </div>

      {/* Aspect-locked stage: aspect-ratio only md+ (reserves the route height, CLS=0);
          on mobile it sizes to the stacked list. */}
      <div
        className="relative mx-auto w-full max-w-[1040px] md:[aspect-ratio:var(--syn-aspect)]"
        style={{ ["--syn-aspect" as string]: `${VBW} / ${VBH}` }}
      >
        {/* The dendrite — desktop only, decorative (aria-hidden). Ships FULLY DRAWN so
            no-JS / RM render a static lit network. Glow = stacked low-opacity strokes
            + pre-rendered radial blooms, NEVER blur (composites over the live WebGL). */}
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          className="absolute inset-0 hidden size-full overflow-visible md:block"
          fill="none"
        >
          <defs>
            <linearGradient id="syn-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="52%" stopColor="var(--color-accent-violet)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
            <radialGradient id="syn-bloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="0.9" />
              <stop offset="45%" stopColor="var(--color-accent-violet)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Synaptic blooms behind the wire — the iridescent "blobs" at each bend. */}
          {pts.map((p, i) => (
            <g
              key={`bloom-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-30")}
            >
              <circle className="syn-bloom" r={8.5} fill="url(#syn-bloom)" opacity={0.42} />
            </g>
          ))}

          {/* Base rail (always full) — "the route exists" whisper. */}
          <path d={d} stroke="var(--color-line)" strokeWidth={0.55} strokeLinecap="round" />
          {/* Coloured glow bed (always full) — a faint bed for the draw to light into. */}
          <path d={d} stroke="url(#syn-stroke)" strokeWidth={2.4} strokeLinecap="round" opacity={0.1} />
          {/* Wide soft halo + thin sharp core (DrawSVG-scrubbed together). */}
          <path ref={haloRef} d={d} stroke="url(#syn-stroke)" strokeWidth={5} strokeLinecap="round" opacity={0.12} />
          <path ref={coreRef} d={d} stroke="url(#syn-stroke)" strokeWidth={1.15} strokeLinecap="round" />
          {/* Always-on dendritic "current" — never DrawSVG'd; motion-safe so reduced
              motion freezes it to static dashes. "2 4" matches the geo-flow keyframe. */}
          <path
            d={d}
            stroke="url(#syn-stroke)"
            strokeWidth={0.7}
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity={0.5}
            className="motion-safe:[animation:geo-flow_5s_linear_infinite]"
          />

          {/* Dendritic stems: dotted leader from each synapse to its card edge. Ship
              visible (full draw); GSAP sets the hidden start only under the matched query. */}
          {pts.map((p, i) => {
            const side = sideFor(i);
            const targetX = LANE[side].edge;
            return (
              <path
                key={`stem-${i}`}
                ref={(el) => {
                  stemRefs.current[i] = el;
                }}
                d={`M ${p.x} ${p.y} H ${targetX}`}
                stroke="url(#syn-stroke)"
                strokeWidth={0.5}
                strokeLinecap="round"
                strokeDasharray="0.8 2.4"
                opacity={0.55}
                className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-20")}
              />
            );
          })}

          {/* Synapses on the wire: idle hollow indigo bead -> ignites to cyan + halo +
              one-shot ping. Ship LIT (markup); GSAP resets to dormant under the query. */}
          {pts.map((p, i) => (
            <g
              key={`node-${i}`}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-40")}
            >
              <circle className="syn-halo" r={2.6} fill="var(--color-accent-cyan)" opacity={0} />
              <circle className="syn-ping" r={2.6} fill="none" stroke="var(--color-accent-cyan)" strokeWidth={0.4} opacity={0} />
              <circle r={2.6} fill="none" stroke="var(--color-accent)" strokeWidth={0.35} opacity={0.3} />
              <circle
                className="syn-core"
                r={1.15}
                fill="var(--color-accent-cyan)"
                stroke="var(--color-accent-cyan)"
                strokeWidth={0.5}
              />
            </g>
          ))}

          {/* The charge ORB — white-hot cyan light source riding the drawn leading edge,
              banking into turns with a backward comet streak. RM never renders it. */}
          <g ref={orbRef} transform={`translate(${start.x} ${start.y})`} className="motion-reduce:hidden">
            {/* streak points backward (-x) within the group, so the rotate trails it. */}
            <ellipse cx={-3.4} cy={0} rx={3.6} ry={0.7} fill="var(--color-accent-cyan)" opacity={0.18} />
            <ellipse cx={-1.8} cy={0} rx={2.2} ry={0.9} fill="var(--color-accent-cyan)" opacity={0.3} />
            <circle r={2.8} fill="var(--color-accent-cyan)" opacity={0.14} />
            <circle r={1.5} fill="var(--color-accent-cyan)" opacity={0.5} />
            <circle r={0.85} fill="var(--color-accent-cyan)" />
            <circle r={0.36} fill="#ffffff" opacity={0.95} />
          </g>
        </svg>

        {/* The accessible content: ONE real <ol>. Stacked flow with a LEFT gradient rail
            by default (mobile / RM / no-JS); md+ places each card on the OUTER side of
            its synapse (CSS top:%, no JS measurement, CLS=0). */}
        <ol
          className={cn(
            "relative space-y-5 pl-7 md:absolute md:inset-0 md:space-y-0 md:pl-0",
            // Mobile-only left rail (indigo -> violet -> cyan), the "line on the left".
            "before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px md:before:hidden",
            "before:bg-gradient-to-b before:from-accent/45 before:via-accent-violet/35 before:to-accent-cyan/45",
          )}
        >
          {pts.map((p, i) => {
            const side = sideFor(i);
            return (
              <li
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{ top: `${(p.y / VBH) * 100}%` }}
                className={cn(
                  "relative md:absolute md:max-w-[46%] md:-translate-y-1/2",
                  LANE[side].className,
                )}
              >
                {/* Mobile synapse bead on the left rail (desktop uses the SVG synapse). */}
                <span
                  aria-hidden
                  className="absolute left-[-1.35rem] top-6 size-2 rounded-full bg-accent-cyan ring-2 ring-accent-cyan/30 md:hidden"
                />
                {renderCard(i, side, active === i)}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
