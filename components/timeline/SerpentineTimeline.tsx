"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { type Beat, scoreForCount } from "./argmax";
import type { SpineProgress } from "./flight-progress";

/**
 * SerpentineTimeline — "The Constellation Spine". The ONE timeline engine, shared by the
 * /about journey and the /work shipped-systems list.
 *
 * A single straight vertical rail runs down a left gutter; each milestone is a node ON
 * that rail with its card flowing beside it in normal document order (newest reads
 * top-down). As you scroll, the rail DRAWS from the top in the iridescent duotone and a
 * single head-dot rides its leading edge, igniting each node as it passes — the one
 * signature motion. Everything else is quiet, crisp vector: no WebGL, no starfield, no
 * decorative fans/scars/constellation. (This replaced a WebGL "lightning bolt" set-piece
 * that read as illegible cards floating in a starfield — see git history + plan.md.)
 *
 * Contract, unchanged for the adapters (Geoline / WorkGeoline):
 *   count, renderCard(i, side, isActive), hudLabel, beats?, dimmed?, className
 * `beats[i].weight` is still the per-milestone size/emphasis knob the cards read.
 *
 * Hard gates (DESIGN.md): CLS=0 (pure document flow — rail/markers/head are all
 * absolutely positioned and never affect layout); exactly ONE scrubbed ScrollTrigger
 * (rail draw + head + node ignition + HUD), with card entrances on separate once:true
 * batch triggers; reduced-motion / mobile / no-JS render the FINAL state (rail fully
 * drawn, every node lit, every card visible) — start states are set at runtime, never in
 * CSS, so there is never a blank section.
 */

export type RenderCard = (
  i: number,
  side: "left" | "right",
  isActive: boolean,
) => ReactNode;

// Rail geometry (px). The node column is fixed-width so the rail x stays put across
// breakpoints; the card takes the rest. RAIL_X is the rail's centre inside the <ol>;
// MARKER_TOP is the node's y within each card (aligned near the card header).
const NODE_COL = 52;
const RAIL_X = 25;
const MARKER_TOP = 32;

export function SerpentineTimeline({
  count,
  renderCard,
  hudLabel,
  beats: beatsProp,
  dimmed,
  className,
  flightRef,
}: {
  count: number;
  renderCard: RenderCard;
  hudLabel: string;
  /** The narrative score — one Beat per milestone (defaults to a procedural score). */
  beats?: Beat[];
  /** Optional filter spotlight (the /work pills): return true to dim milestone i. */
  dimmed?: (i: number) => boolean;
  className?: string;
  /** Write-only side channel for the Flight backdrop (timelineplan.md §9): the engine
   *  writes p/offsets/litCount here; the canvas reads them raw. Never read back. */
  flightRef?: RefObject<SpineProgress>;
}) {
  const n = count;
  const beats = beatsProp && beatsProp.length === n ? beatsProp : scoreForCount(n);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const railLitRef = useRef<SVGLineElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(-1);
  const lastLit = useRef(-1);

  useGSAP(
    () => {
      const list = listRef.current;
      const lit = railLitRef.current;
      const head = headRef.current;
      if (!list || !lit || !head) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = itemRefs.current.map((li) => li?.querySelector("[data-card]")).filter(Boolean) as HTMLElement[];
        const markers = markerRefs.current.filter(Boolean) as HTMLElement[];

        // Runtime start states (never CSS — no-JS/RM keeps the final drawn state:
        // rail fully drawn, every node lit, cards visible). Nodes default LIT, so
        // motion adds `is-pending` (the hollow-ring start) and ignition removes it.
        lit.style.strokeDashoffset = "1";
        gsap.set(head, { autoAlpha: 0, xPercent: -50, yPercent: -50, y: 0 });
        markers.forEach((m) => m.classList.add("is-pending"));
        gsap.set(cards, { autoAlpha: 0, y: 16 });
        if (countRef.current) countRef.current.textContent = "00";
        if (barRef.current) barRef.current.style.transform = "scaleX(0)";
        lastLit.current = -1;

        // Node offsets: the marker's y within the rail's height, so a node ignites
        // exactly as the head-dot reaches it. Recomputed on refresh (resize/font swap).
        let offsets: number[] = [];
        const measure = () => {
          const H = list.clientHeight || 1;
          offsets = itemRefs.current.map((li) => (li ? (li.offsetTop + MARKER_TOP) / H : 0));
          if (flightRef?.current) flightRef.current.offsets = offsets.slice();
        };
        measure();

        const railHeight = () => list.clientHeight || 0;

        // THE one scrubbed ScrollTrigger: rail draw + head-dot + node ignition + HUD.
        const st = ScrollTrigger.create({
          trigger: list,
          start: "top 62%",
          end: "bottom 62%",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onRefresh: measure,
          onUpdate: (self) => {
            const p = self.progress;
            if (flightRef?.current) flightRef.current.p = p;
            lit.style.strokeDashoffset = String(1 - p);
            gsap.set(head, {
              autoAlpha: p > 0.001 && p < 0.999 ? 1 : 0,
              xPercent: -50,
              yPercent: -50,
              y: p * railHeight(),
            });
            let count = 0;
            for (let i = 0; i < offsets.length; i++) {
              const on = p >= offsets[i] - 0.001;
              if (on) count++;
              const m = markerRefs.current[i];
              if (m) m.classList.toggle("is-pending", !on);
            }
            if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(3)})`;
            if (count !== lastLit.current) {
              lastLit.current = count;
              if (countRef.current) countRef.current.textContent = String(count).padStart(2, "0");
              if (flightRef?.current) flightRef.current.litCount = count;
              setActive(count - 1);
            }
          },
        });

        // Card entrances — separate, once (never replay on re-scroll: NN/g).
        const batch = ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "expo.out",
              stagger: 0.09,
              overwrite: true,
            }),
        });

        return () => {
          st.kill();
          batch.forEach((b) => b.kill());
        };
      });
    },
    { scope: rootRef, dependencies: [n] },
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Live counter — aria-hidden ambient flavour, solid surface (no blur). */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-20 z-20 mb-8 hidden justify-end md:flex"
      >
        <div className="flex items-center gap-3 rounded-full border border-line bg-base/90 px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
            {hudLabel}
          </span>
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

      <ol ref={listRef} className="relative flex flex-col gap-11 sm:gap-14">
        {/* THE RAIL — full height of the list, in the node gutter. Absolute: never
            affects layout (CLS=0). Base line is always visible (unlit-ahead); the lit
            gradient line draws top-down on scroll; a head-dot rides its tip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-0"
          style={{ left: RAIL_X - 1, width: 2 }}
        >
          <svg className="absolute inset-0 size-full" viewBox="0 0 2 100" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="spine-grad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="52%" stopColor="var(--color-accent-violet)" />
                <stop offset="100%" stopColor="var(--color-accent-cyan)" />
              </linearGradient>
            </defs>
            {/* faint always-on rail (the path ahead of the head) */}
            <line
              x1="1"
              y1="0"
              x2="1"
              y2="100"
              stroke="var(--color-ink)"
              strokeOpacity="0.1"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {/* lit rail — drawn via dashoffset (default 0 = fully drawn for no-JS/RM) */}
            <line
              ref={railLitRef}
              x1="1"
              y1="0"
              x2="1"
              y2="100"
              stroke="url(#spine-grad)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={0}
            />
          </svg>
          {/* head-dot — hidden until motion arms it; GSAP owns its transform. The
              spine-head class lets a live Flight canvas borrow its outer bloom
              (data-flight-live on the adapter root) — dot stays, glow hands off. */}
          <span
            ref={headRef}
            className="spine-head invisible absolute left-1/2 top-0 size-2.5 rounded-full bg-accent-cyan shadow-[0_0_10px_2px_var(--color-accent-cyan),0_0_20px_6px_oklch(66%_0.19_285/0.5)]"
          />
        </div>

        {beats.map((_, i) => {
          const isDim = dimmed?.(i) ?? false;
          return (
            <li
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={cn(
                "relative z-10 flex items-start gap-4 sm:gap-6",
                "transition-opacity duration-500",
                isDim && "opacity-40",
              )}
            >
              {/* node column — holds the marker centred on the rail x */}
              <div className="relative flex-none" style={{ width: NODE_COL }} aria-hidden>
                <span
                  ref={(el) => {
                    markerRefs.current[i] = el;
                  }}
                  className="spine-node absolute size-3.5 rounded-full"
                  style={{ left: RAIL_X, top: MARKER_TOP }}
                />
              </div>

              <div data-card className="min-w-0 max-w-[560px] flex-1">
                {renderCard(i, "right", active === i)}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
