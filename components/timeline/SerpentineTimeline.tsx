"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useGovernedCanvas } from "@/lib/webgl-governance";
import { LivingFiber } from "./LivingFiber";
import {
  VBW,
  vbhFor,
  LANE,
  type Connection,
  waypoints,
  serpentinePath,
  sideFor,
  sampleCenterline,
  buildConstellation,
} from "./geometry";

/**
 * SerpentineTimeline (Phase 6, "Living Fiber") — the ONE timeline engine, shared by the
 * /about journey and the /work shipped-systems list.
 *
 * On a capable desktop it mounts a max-fidelity WebGL set-piece (LivingFiberCanvas): a
 * volumetric channel of light — white-hot core + indigo→violet→cyan aura, energy
 * filaments, ~1.8k streaming particles, organic dendrites, bloom nodes igniting under a
 * charge orb, and the knowledge-graph stars + bridges lighting across milestones. ONE
 * scrubbed ScrollTrigger writes a shared `progressRef` that the canvas reads each frame,
 * so the fiber wakes up in lockstep with the DOM cards.
 *
 * Everything accessible stays in the DOM: a real <ol> of cards (revealed on the same
 * scroll clock), capability chips (the readable form of the graph), the live HUD counter,
 * and the mobile left-rail list. A fully-lit STATIC SVG poster is always rendered as the
 * no-WebGL / reduced-motion / no-JS / pre-arm fallback (it fades out once the canvas is
 * live so the two never fight). Reduced motion / mobile never mount WebGL.
 *
 * Hard gates (DESIGN.md): CLS=0 via fixed-viewBox + container aspect-ratio (the canvas
 * shares the exact same box); ONE scrubbed ScrollTrigger; the canvas is governed
 * (dpr-capped, FPS-guarded, in-view/armed, desktop-motion only) and transparent (additive
 * glow, no opaque post-process buffer) so it composites over the page's LatentField.
 */

export type RenderCard = (
  i: number,
  side: "left" | "right",
  isActive: boolean,
) => ReactNode;

export function SerpentineTimeline({
  count,
  renderCard,
  hudLabel,
  constellation,
  dimmed,
  className,
}: {
  count: number;
  renderCard: RenderCard;
  hudLabel: string;
  /** Knowledge-graph layer: constellation[i] = the tags milestone i activates. */
  constellation?: Connection[][];
  /** Optional filter spotlight: return true to dim milestone i (poster only, no reflow). */
  dimmed?: (i: number) => boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);

  const [active, setActive] = useState(-1);
  const lastCount = useRef(0);

  const n = count;
  const VBH = vbhFor(n);
  const pts = useMemo(() => waypoints(n), [n]);
  const d = useMemo(() => serpentinePath(pts), [pts]);
  const centerline = useMemo(() => sampleCenterline(pts), [pts]);
  const cnst = useMemo(() => buildConstellation(pts, constellation), [pts, constellation]);

  // Governed mount gate for the WebGL fiber (desktop + motion + WebGL + in-view + armed).
  // 600px rootMargin mounts it well BEFORE the stage is on screen (the chunk + context
  // are warm by the time the user arrives).
  const { ref: gateRef, show, inView, eligible, webglOk } = useGovernedCanvas<HTMLDivElement>({
    ref: stageRef,
    profile: "desktop-motion",
    rootMargin: "600px 0px",
    arm: true,
  });

  // Sticky mount: once the canvas has existed, keep it (pause via `running` instead of
  // unmounting — re-creating a WebGL context on every scroll-past caused Context Lost).
  // Guarded render-time latch (the docs-blessed "adjust state during render" idiom).
  const [everShown, setEverShown] = useState(false);
  if (show && !everShown) setEverShown(true);

  // The canvas chunk is ASYNC (code-split). `live` flips only after it renders real
  // frames — the static poster stays visible until that exact moment, so there is
  // never a dark gap between "gate open" and "fiber actually glowing".
  const [live, setLive] = useState(false);

  // Warm the heavy chunk as soon as the device qualifies (instead of when the user
  // reaches the stage): in dev this also frontloads the on-demand compile.
  useEffect(() => {
    if (!(eligible && webglOk)) return;
    const t = window.setTimeout(() => {
      void import("./LivingFiberCanvas");
    }, 250);
    return () => window.clearTimeout(t);
  }, [eligible, webglOk]);

  // ONE scrubbed timeline: reveals the DOM cards, drives the HUD counter, and writes the
  // shared progress the WebGL fiber reads. (The fiber owns all the heavy visual motion;
  // when WebGL is off, the static SVG poster below carries the look.)
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
        const nodeFrac = centerline.nodeFrac;

        gsap.set(cards, { autoAlpha: 0 });
        if (barRef.current) gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left center" });
        lastCount.current = 0;
        if (countRef.current) countRef.current.textContent = "00";
        progressRef.current = 0;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 74%",
            end: "bottom 58%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to({}, { duration: 1, ease: "none" }, 0); // master 0->1 clock

        cards.forEach((card, i) => {
          const fromX = sideFor(i) === "left" ? -16 : 16;
          tl.fromTo(
            card,
            { autoAlpha: 0, yPercent: -50, y: 18, x: fromX },
            { autoAlpha: 1, yPercent: -50, y: 0, x: 0, duration: 0.16, ease: "expo.out" },
            nodeFrac[i] ?? 0,
          );
        });

        tl.eventCallback("onUpdate", () => {
          const p = tl.progress();
          progressRef.current = p;
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
    { scope: rootRef, dependencies: [n] },
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Live counter (gamified, aria-hidden ambient flavour). Ships its final state. */}
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

      {/* Aspect-locked stage (CLS=0). The SVG poster, the WebGL canvas and the <ol> all
          share this exact box; on mobile it sizes to the stacked list. */}
      <div
        ref={gateRef}
        className="relative mx-auto w-full max-w-[1040px] md:[aspect-ratio:var(--syn-aspect)]"
        style={{ ["--syn-aspect" as string]: `${VBW} / ${VBH}` }}
      >
        {/* STATIC, fully-lit SVG poster — the SSR / reduced-motion / no-JS / no-WebGL /
            pre-arm fallback. Decorative (aria-hidden). Fades out once the live canvas is
            up so the two never composite over each other. */}
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          className={cn(
            "absolute inset-0 hidden size-full overflow-visible transition-opacity duration-700 md:block",
            live && "opacity-0",
          )}
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

          {/* Synaptic blooms behind the wire. */}
          {pts.map((p, i) => (
            <g
              key={`bloom-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-30")}
            >
              <circle r={8.5} fill="url(#syn-bloom)" opacity={0.4} />
            </g>
          ))}

          {/* Knowledge-graph bridges + spurs + stars (static lit). */}
          {cnst.bridges.map((b) => (
            <path
              key={b.key}
              d={b.d}
              stroke="url(#syn-stroke)"
              strokeWidth={0.4}
              strokeLinecap="round"
              fill="none"
              opacity={0.22}
              className={cn("transition-opacity duration-300", dimmed?.(b.at) && "opacity-10")}
            />
          ))}
          {cnst.spurs.map((sp, idx) => (
            <path
              key={`spur-${idx}`}
              d={sp.d}
              stroke="url(#syn-stroke)"
              strokeWidth={0.45}
              strokeLinecap="round"
              fill="none"
              opacity={0.5}
              className={cn("transition-opacity duration-300", dimmed?.(sp.milestone) && "opacity-15")}
            />
          ))}
          {cnst.stars.map((s) => (
            <g
              key={s.key}
              transform={`translate(${s.x} ${s.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(s.milestone) && "opacity-25")}
            >
              <circle r={3.2} fill="url(#syn-bloom)" opacity={0.5} />
              <circle r={1.05} fill="var(--color-accent-cyan)" opacity={0.25} />
              <circle
                r={0.5}
                fill="var(--color-accent-cyan)"
                className="motion-safe:[animation:star-twinkle_3.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${(0.2 + (s.k % 5) * 0.5).toFixed(2)}s` }}
              />
            </g>
          ))}

          {/* The wire — base rail + coloured glow bed + soft halo + sharp core. */}
          <path d={d} stroke="var(--color-line)" strokeWidth={0.55} strokeLinecap="round" />
          <path d={d} stroke="url(#syn-stroke)" strokeWidth={2.4} strokeLinecap="round" opacity={0.12} />
          <path d={d} stroke="url(#syn-stroke)" strokeWidth={5} strokeLinecap="round" opacity={0.12} />
          <path d={d} stroke="url(#syn-stroke)" strokeWidth={1.15} strokeLinecap="round" />
          {/* Always-on dendritic "current" (motion-safe; reduced-motion freezes it). */}
          <path
            d={d}
            stroke="url(#syn-stroke)"
            strokeWidth={0.7}
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity={0.5}
            className="motion-safe:[animation:geo-flow_5s_linear_infinite]"
          />

          {/* Card stems. */}
          {pts.map((p, i) => {
            const side = sideFor(i);
            const targetX = LANE[side].edge;
            return (
              <path
                key={`stem-${i}`}
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

          {/* Synapses (lit beads). */}
          {pts.map((p, i) => (
            <g
              key={`node-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-40")}
            >
              <circle r={2.6} fill="none" stroke="var(--color-accent)" strokeWidth={0.35} opacity={0.3} />
              <circle r={1.15} fill="var(--color-accent-cyan)" stroke="var(--color-accent-cyan)" strokeWidth={0.5} />
            </g>
          ))}
        </svg>

        {/* The live WebGL fiber — desktop / motion / WebGL / armed only. Mounts when
            first near view, then STAYS mounted (frameloop pauses off-view instead). */}
        {(everShown || show) && (
          <LivingFiber
            vbw={VBW}
            vbh={VBH}
            centerline={centerline}
            waypoints={pts}
            nodeFrac={centerline.nodeFrac}
            stars={cnst.stars}
            spurs={cnst.spurs}
            bridges={cnst.bridges}
            progressRef={progressRef}
            running={inView}
            onLive={() => setLive(true)}
          />
        )}

        {/* The accessible content: ONE real <ol>. Mobile = left-rail stacked list; md+
            places each card on the OUTER side of its synapse (CSS top:%, CLS=0). */}
        <ol
          className={cn(
            "relative space-y-5 pl-7 md:absolute md:inset-0 md:space-y-0 md:pl-0",
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
