"use client";

import { useMemo, useRef } from "react";
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
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import type { TimelineEntry } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * The journey timeline (V4 redesign) — "How I Got Here" as a CINEMATIC GUIDED
 * ROUTE you travel by scrolling down. A single near-vertical MERIDIAN runs down
 * the centre of the column (x≈50 in a 0–100 viewBox) with only a ±6-unit S-drift,
 * so it reads top→bottom with zero lateral eye-hunting — editorial timeline
 * grammar (Linear/Stripe), the opposite of the old left-right-left "snake".
 *
 * As you scroll the route DRAWS (DrawSVG, scrubbed to natural page scroll): a thin
 * 1.1-unit "fibre-optic" core rides on a wide 5-unit/0.12 soft halo (NO blur
 * filters — glow = stacked low-opacity strokes so it stays cheap over the live
 * page-wide LatentField WebGL). A white-hot cyan ORB sits exactly on the drawn
 * leading edge. Each milestone NODE ignites (hollow indigo bead → filled cyan +
 * halo + one-shot radar ping) as the orb arrives, a dotted CONNECTOR draws out to
 * its glass card, and the card reveals + lights its `.is-active` glow on the SAME
 * arc-length clock — so route, orb, node, connector and card light up as one beat.
 * Cyan is reserved strictly for that arrival moment, so exactly one card is lit at
 * a time (spotlight = focus). Every beat lives on the scrubbed timeline, so
 * scrolling back UP un-ignites everything in reverse.
 *
 * Coordinate trick: a fixed viewBox `0 0 100 VBH` + a container whose CSS
 * aspect-ratio equals 100/VBH (md+ only), so a route point (x, y) maps to
 * container % (x%, y/VBH*100%) — cards land on their nodes with zero JS
 * measurement and CLS = 0.
 *
 * A11y / R7: the cards are ONE real, readable <ol> (the SVG route + nodes + orb +
 * connectors + mobile beads are all aria-hidden; the kind/period/title/desc are
 * real announced text). Cards ship VISIBLE; on desktop CSS places them on the
 * meridian and GSAP sets the hidden start ONLY under (min-width:768px) +
 * no-preference. Mobile = a clean stacked list with a gradient rail on the LEFT;
 * RM / no-JS = full static lit route + visible cards (orb/ping motion-reduce:hidden;
 * the flow dash is motion-safe). Card placement is pure CSS (not gsap.set), so it's
 * correct from first paint even before the lazy DrawSVG chunk arms — no flash.
 */

// ── Geometry (the meridian) ──────────────────────────────────────────────────
const VBW = 100;
const CX = 50; // meridian centre lane
const DRIFT = 6; // max S-sway either side of centre — alive, but never a switchback
const PAD = 30; // top/bottom clearance — node 0 sits low enough that a card pulled up by
//                 -translate-y-1/2 stays clear of the H2, and node n-1 clears the box base
const SEG = 30; // vertical gap per milestone

type Pt = { x: number; y: number };

/** Centre-lane waypoints: one slow S over the whole column (sin, 1.5 periods). */
function waypoints(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: CX + DRIFT * Math.sin((i * Math.PI) / 3),
    y: PAD + i * SEG,
  }));
}

/**
 * A single smooth cubic spline through the points, but VERTICAL-DOMINANT: both
 * control handles point straight down (Δx = 0, Δy = ±SEG/2). The curve can only
 * bow gently left/right between nodes — a meridian S, mathematically incapable of
 * a sharp switchback — and y stays strictly monotonic (the nodeFrac bisection
 * below is provably safe).
 */
function meridianPath(p: Pt[]): string {
  if (p.length < 2) return "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const dy = b.y - a.y;
    d += ` C ${a.x} ${a.y + dy * 0.5} ${b.x} ${b.y - dy * 0.5} ${b.x} ${b.y}`;
  }
  return d;
}

// ── Milestone kind/icon map ──────────────────────────────────────────────────
// Positional, keyed to the data/content.ts `timeline` order — so the data shape
// (TimelineEntry = {period,title,description}) is untouched. A milestone past the
// end of the map falls back to the last entry, so adding one never crashes SSR.
type Kind = { Icon: LucideIcon; tag: string };
const KIND: Kind[] = [
  { Icon: Terminal, tag: "Origin" }, // First lines of Python
  { Icon: GraduationCap, tag: "Education" }, // B.Tech in AI, Marwadi University
  { Icon: Building2, tag: "Role" }, // Python Developer, BotPro Solutions
  { Icon: BrainCircuit, tag: "Milestone" }, // First AI agents in production
  { Icon: Award, tag: "Award" }, // Mr Perfectionist Award
  { Icon: Sparkles, tag: "Role" }, // Python & AI/ML Engineer, VRSEN
  { Icon: Compass, tag: "Independent" }, // Independent. Building for clients worldwide.
];

export function Geoline({ entries }: { entries: TimelineEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const connRefs = useRef<(SVGPathElement | null)[]>([]);
  const pipRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ready = useExtraPlugins(); // DrawSVG lives in the lazy chunk

  const n = entries.length;
  const VBH = PAD * 2 + (n - 1) * SEG;
  const pts = useMemo(() => waypoints(n), [n]);
  const d = useMemo(() => meridianPath(pts), [pts]);
  const start = pts[0] ?? { x: CX, y: PAD };

  useGSAP(
    () => {
      if (!ready) return; // re-runs when the DrawSVG chunk resolves
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const line = lineRef.current;
        if (!line) return;
        const total = line.getTotalLength(); // cached ONCE (NEVER per frame)
        const draws = [glowRef.current, line].filter(Boolean) as SVGPathElement[];
        const nodes = nodeRefs.current.filter(Boolean) as SVGGElement[];
        const conns = connRefs.current.filter(Boolean) as SVGPathElement[];
        const pips = pipRefs.current.filter(Boolean) as SVGCircleElement[];
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

        // Arc-length fraction of each waypoint: bisect the length whose point.y ==
        // the node's y. y is STRICTLY monotonic down the meridian, so this fraction
        // is BOTH where the orb is and when the node/connector/card fires — orb,
        // draw front, and reveal stay locked together on one clock.
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

        // Orb rides the SAME normalized clock as the draw (both span timeline 0→1),
        // so the head sits exactly at the drawn leading edge instead of lagging it.
        const head = { len: 0 };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 72%",
            end: "bottom 60%",
            scrub: 1, // ≈1s catch-up: glides the orb instead of snapping 1:1 — cinematic
            invalidateOnRefresh: true,
          },
        });

        // 1) Draw the halo + sharp core together (no lag between bloom and line).
        tl.fromTo(draws, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0);

        // 2) Orb on the same 0→1 clock. No rotate (vertical line), no tail — onUpdate
        //    does ~1 getPointAtLength + 1 setAttribute/frame.
        tl.to(
          head,
          {
            len: total,
            duration: 1,
            ease: "none",
            onUpdate: () => {
              const a = line.getPointAtLength(head.len);
              headRef.current?.setAttribute("transform", `translate(${a.x} ${a.y})`);
            },
          },
          0,
        );

        // 3) Per node — ignite as the orb arrives (replaces the old scale(0) pop:
        //    nothing appears from nothing — the bead is already there, it lights up).
        nodes.forEach((node, i) => {
          tl.to(
            node.querySelector(".geo-core"),
            { attr: { fill: "var(--color-accent-cyan)" }, opacity: 1, duration: 0.06, ease: "none" },
            nodeFrac[i],
          );
          tl.fromTo(
            node.querySelector(".geo-halo"),
            { opacity: 0, scale: 1, transformOrigin: "center" },
            { opacity: 0.2, scale: 1.6, duration: 0.1, ease: "back.out(2)" },
            nodeFrac[i],
          );
          // One-shot radar ping (never looping over the live field).
          tl.fromTo(
            node.querySelector(".geo-ping"),
            { opacity: 0.7, scale: 1, transformOrigin: "center" },
            { opacity: 0, scale: 3, duration: 0.18, ease: "power2.out" },
            nodeFrac[i],
          );
        });

        // 4) Connector draws out to the card + its pip docks at the card edge.
        //    These ship statically visible (markup) for unmatched users; GSAP sets
        //    the hidden start HERE so only matched users get the draw-in.
        conns.forEach((c, i) =>
          tl.fromTo(
            c,
            { drawSVG: "0%", opacity: 0 },
            { drawSVG: "100%", opacity: 0.6, duration: 0.1, ease: "power2.out" },
            nodeFrac[i],
          ),
        );
        pips.forEach((p, i) =>
          tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.05 }, nodeFrac[i] + 0.06),
        );

        // 5) Card reveal — yPercent:-50 preserves the CSS md:-translate-y-1/2
        //    centering; y is the only thing that moves. Enter = ease-out. No scale.
        cards.forEach((card, i) =>
          tl.fromTo(
            card,
            { autoAlpha: 0, yPercent: -50, y: 20 },
            { autoAlpha: 1, yPercent: -50, y: 0, duration: 0.14, ease: "expo.out" },
            nodeFrac[i],
          ),
        );

        // 6) Active glow — DO NOT tween box-shadow (per-frame paint over the live
        //    WebGL field). Toggle `.is-active`; CSS owns the 450ms cross-fade.
        tl.eventCallback("onUpdate", () => {
          const p = tl.progress();
          cards.forEach((card, i) => card.classList.toggle("is-active", p >= nodeFrac[i] - 0.005));
        });
      });
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <div ref={rootRef} className="relative mt-12">
      {/* ── StarBackground: section-scoped atmosphere (NO 2nd canvas) ──────────
          Faint indigo bloom behind the "origin" end + cyan bloom behind "Now"
          (echoes the path's indigo→cyan narrative), plus a soft vignette that
          seats the cards over the busy starfield. Static CSS gradients only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_45%_at_50%_0%,oklch(63%_0.21_272/0.08),transparent_70%),radial-gradient(55%_40%_at_50%_100%,oklch(86%_0.115_207/0.06),transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(120%_80%_at_50%_50%,transparent_55%,oklch(4.5%_0.01_278/0.35)_100%)]"
      />

      {/* Aspect-locked box: aspect-ratio only on md+ (reserves the route height,
          CLS=0); on mobile it sizes to the stacked list. */}
      <div
        className="relative mx-auto w-full max-w-[920px] md:[aspect-ratio:var(--geo-aspect)]"
        style={{ ["--geo-aspect" as string]: `${VBW} / ${VBH}` }}
      >
        {/* ── JourneyPath: the meridian — desktop only, decorative. Ships FULLY
            DRAWN (no drawSVG:0% in markup), so no-JS / RM render a static lit
            route. No blur filters: glow = a wide low-opacity halo stroke under
            the sharp core + concentric circles for the orb/node halos. */}
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

          {/* Base rail (always full) — the "route exists" whisper. */}
          <path d={d} stroke="var(--color-line)" strokeWidth={0.6} strokeLinecap="round" />
          {/* Glow bed (always full) — a faint coloured bed for the draw to light into. */}
          <path d={d} stroke="url(#geo-stroke)" strokeWidth={2.2} strokeLinecap="round" opacity={0.1} />
          {/* Wide soft halo + thin sharp core (both DrawSVG-scrubbed together). */}
          <path ref={glowRef} d={d} stroke="url(#geo-stroke)" strokeWidth={5} strokeLinecap="round" opacity={0.12} />
          <path ref={lineRef} d={d} stroke="url(#geo-stroke)" strokeWidth={1.1} strokeLinecap="round" />
          {/* Always-on flowing "current" — never DrawSVG'd; motion-safe so reduced
              motion shows it as static dashes. Keep "2 4" so the shared geo-flow
              keyframe (offset -180, period 6) stays seamless. */}
          <path
            d={d}
            stroke="url(#geo-stroke)"
            strokeWidth={0.7}
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity={0.5}
            className="motion-safe:[animation:geo-flow_5s_linear_infinite]"
          />

          {/* Connectors: a dotted tether from each node out to its card edge, plus
              a pip that docks at the card. Ship statically visible (opacity set in
              markup); GSAP sets the hidden start only under the matched query. */}
          {pts.map((p, i) => {
            const leftLane = i % 2 === 0; // node → card in the right gutter
            const targetX = leftLane ? 54 : 46; // card inner edge ≈ 54% / 46%
            return (
              <g key={`conn-${entries[i]?.title ?? i}`} aria-hidden>
                <path
                  ref={(el) => {
                    connRefs.current[i] = el;
                  }}
                  d={`M ${p.x} ${p.y} H ${targetX}`}
                  stroke="url(#geo-stroke)"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  strokeDasharray="0.6 2"
                  opacity={0.5}
                />
                <circle
                  ref={(el) => {
                    pipRefs.current[i] = el;
                  }}
                  cx={targetX}
                  cy={p.y}
                  r={0.7}
                  fill="var(--color-accent-cyan)"
                  opacity={0.5}
                />
              </g>
            );
          })}

          {/* Nodes ON the meridian: idle hollow indigo bead → ignites to cyan as
              the orb arrives. The geo-halo/geo-ping start invisible (active-only). */}
          {pts.map((p, i) => (
            <g
              key={entries[i]?.title ?? i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
            >
              <circle className="geo-halo" r={2.4} fill="var(--color-accent)" opacity={0} />
              <circle className="geo-ping" r={2.4} fill="none" stroke="var(--color-accent-cyan)" strokeWidth={0.4} opacity={0} />
              <circle r={2.4} fill="none" stroke="var(--color-accent)" strokeWidth={0.35} opacity={0.25} />
              <circle
                className="geo-core"
                r={1.0}
                fill="var(--color-base)"
                stroke="var(--color-accent)"
                strokeWidth={0.5}
                opacity={0.6}
              />
            </g>
          ))}

          {/* Orb: white-hot cyan light source riding the drawn leading edge. No
              filters; no rotate (vertical route); no tail. RM never renders it. */}
          <g ref={headRef} transform={`translate(${start.x} ${start.y})`} className="motion-reduce:hidden">
            <circle r={3.4} fill="var(--color-accent-cyan)" opacity={0.12} />
            <circle r={1.7} fill="var(--color-accent-cyan)" opacity={0.42} />
            <circle r={0.95} fill="var(--color-accent-cyan)" />
            <circle r={0.42} fill="#ffffff" opacity={0.9} />
          </g>
        </svg>

        {/* ── JourneyCard: the SINGLE accessible <ol>. Stacked flow with a gradient
            rail on the LEFT by default (mobile / RM / no-JS); on md+ CSS places each
            glass card on the OUTER side of its node (no JS measurement, CLS=0). */}
        <ol
          className={cn(
            // Mobile: normal flow with a left rail. Desktop: fill the aspect box
            // (absolute inset-0) so each card's top:% resolves against the FULL box
            // height (an auto-height <ol> collapses to 0 under absolute children, which
            // would stack every card at the same Y).
            "relative space-y-5 pl-7 md:absolute md:inset-0 md:space-y-0 md:pl-0",
            // Mobile-only left rail (the "line on the left"), indigo→violet→cyan.
            "before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px md:before:hidden",
            "before:bg-gradient-to-b before:from-accent/40 before:via-accent-violet/30 before:to-accent-cyan/40",
          )}
        >
          {entries.map((entry, i) => {
            const leftLane = i % 2 === 0; // node on the meridian → card in right gutter
            const { Icon, tag } = KIND[i] ?? KIND[KIND.length - 1];
            return (
              <li
                key={entry.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{ top: `${(pts[i].y / VBH) * 100}%` }}
                className={cn(
                  "group relative isolate w-full overflow-hidden rounded-[18px] p-[22px]",
                  // Glass: translucent tint + cheap blur/saturate (md+ only; mobile
                  // stays a near-solid bg so low-end phones pay zero blur cost).
                  "border border-line bg-base/85",
                  "md:bg-[linear-gradient(180deg,oklch(22.5%_0.016_278/0.72),oklch(14.5%_0.012_278/0.66))] md:[backdrop-filter:blur(10px)_saturate(125%)]",
                  // Top-lip highlight + soft contact shadow (floats the card off the field).
                  "shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(235,236,250,0.10)]",
                  // The active glow cross-fades via CSS (NOT GSAP) over 450ms.
                  "transition-[box-shadow,background-color,border-color] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  // Hover affordance = border/shadow only (GSAP owns transform).
                  "hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.9),0_0_30px_-18px_oklch(63%_0.21_272/0.40),inset_0_1px_0_rgba(235,236,250,0.12)]",
                  "hover:[&::after]:opacity-95",
                  // 1px gradient ring (the "glowing edge") via mask-composite — a
                  // diagonal so light has one direction; the base border-line is the
                  // graceful fallback if mask-composite is unsupported. Set the mask
                  // as LONGHANDS (image + clip + composite), never the `mask`/`-webkit-mask`
                  // shorthand — the shorthand resets mask-composite back to `add` (which
                  // fills the box instead of cutting a ring).
                  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:p-px after:content-['']",
                  "after:[background:linear-gradient(150deg,oklch(66%_0.19_285/0.45),oklch(86%_0.115_207/0.16)_40%,transparent_70%)]",
                  "after:[-webkit-mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)] after:[mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)]",
                  "after:[-webkit-mask-clip:content-box,border-box] after:[mask-clip:content-box,border-box]",
                  "after:[-webkit-mask-composite:xor] after:[mask-composite:exclude]",
                  "after:opacity-70 after:transition-opacity after:duration-[450ms]",
                  // Active state (GSAP toggles .is-active): bg lift + ring + bloom —
                  // border/shadow/bg only, never transform.
                  "[&.is-active]:border-transparent",
                  "[&.is-active]:bg-[linear-gradient(180deg,oklch(22.5%_0.016_278/0.80),oklch(14.5%_0.012_278/0.72))]",
                  "[&.is-active]:shadow-[0_0_0_1px_oklch(66%_0.19_285/0.20),0_22px_60px_-30px_rgba(0,0,0,0.9),0_0_44px_-16px_oklch(63%_0.21_272/0.45),inset_0_1px_0_rgba(235,236,250,0.14)]",
                  "[&.is-active]:after:opacity-100",
                  "[&.is-active]:after:[background:linear-gradient(150deg,oklch(66%_0.19_285/0.85),oklch(86%_0.115_207/0.40)_45%,oklch(63%_0.21_272/0.15)_80%)]",
                  // Placement (CLS=0): top:% from inline style, md:absolute, gutter lane.
                  "md:absolute md:max-w-[44%] md:-translate-y-1/2",
                  leftLane ? "md:left-[54%] md:right-0" : "md:left-0 md:right-[54%]",
                )}
              >
                {/* Mobile node bead on the left rail (desktop uses the SVG node). */}
                <span
                  aria-hidden
                  className="absolute left-[-1.35rem] top-[26px] size-2 rounded-full bg-base ring-2 ring-accent/50 md:hidden"
                />

                {/* Gradient accent line — a 44px indigo→cyan leading edge tab. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[24px] top-0 h-[2px] w-[44px] rounded-[2px] bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-cyan))] opacity-90 shadow-[0_0_12px_-2px_var(--color-accent)]"
                />

                {/* Header row: ICON · TAG ......... YEAR */}
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
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
