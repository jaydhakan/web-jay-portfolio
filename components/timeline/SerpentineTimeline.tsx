"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useGovernedCanvas } from "@/lib/webgl-governance";
import { ArgmaxFiber } from "./ArgmaxFiber";
import { VBW, LANE, type Connection, buildConstellation } from "./geometry";
import {
  type Beat,
  buildArgmax,
  scoreForCount,
  channelPolygon,
  ghostPolygon,
  polylineD,
} from "./argmax";

/**
 * SerpentineTimeline (Phase 7, "ARGMAX — The Paths Not Taken") — the ONE timeline
 * engine, shared by the /about journey and the /work shipped-systems list. See
 * TIMELINE_REDESIGN.md (concept 8) and TIMELINE_IMPLEMENTATION.md.
 *
 * The path is the main character: an inference trajectory drawn as a slow lightning
 * bolt. Deliberate kinks at decision points, ghost futures fanning at each one, a
 * collapse when the story arrives (argmax — one branch survives), permanent scars where
 * the others died, a channel that gains caliber as the story grows, and an OPEN DELTA at
 * the end — the one fork never collapsed ("currently sampling"). Narrative lives in the
 * geometry itself via the authored Beat score (weight / run / kink / ghosts / caliber),
 * so rhythm is uneven and every milestone has its own visual weight.
 *
 * Everything accessible stays in the DOM: a real <ol> of cards (revealed on the same
 * scroll clock), capability chips, the live HUD counter, and the mobile left-rail list.
 * The static SVG poster is the FULLY-DECODED artwork (channel + scars + open delta) —
 * the finished piece for no-WebGL / reduced-motion / no-JS / pre-arm, fading out only
 * when the live canvas takes over.
 *
 * Hard gates (DESIGN.md): CLS=0 via fixed-viewBox + container aspect-ratio; ONE scrubbed
 * ScrollTrigger (ease "none" inside the scrub); governed canvas (dpr-capped, FPS-guarded,
 * desktop-motion only); no backdrop-blur anywhere over the WebGL stage.
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
  beats: beatsProp,
  caption = "currently sampling",
  constellation,
  dimmed,
  className,
}: {
  count: number;
  renderCard: RenderCard;
  hudLabel: string;
  /** The narrative score — one Beat per milestone. Defaults to a deterministic
   *  procedural score; /about passes the authored ABOUT_SCORE. */
  beats?: Beat[];
  /** Mono caption under the open delta (null hides it). */
  caption?: string | null;
  /** Knowledge-graph layer: constellation[i] = the tags milestone i activates. */
  constellation?: Connection[][];
  /** Optional filter spotlight: return true to dim milestone i (no reflow). */
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
  const beats = useMemo(
    () => (beatsProp && beatsProp.length === n ? beatsProp : scoreForCount(n)),
    [beatsProp, n],
  );
  const build = useMemo(() => buildArgmax(beats), [beats]);
  const { line, width, nodes, sides, scars, delta, vbh: VBH } = build;
  const cnst = useMemo(() => buildConstellation(nodes, constellation), [nodes, constellation]);

  // Attention mask for the WebGL layer (the /work filter): 1 = masked. The poster gets
  // the same treatment via CSS classes below; the canvas eases between states itself.
  const mask = useMemo(() => nodes.map((_, i) => (dimmed?.(i) ? 1 : 0)), [dimmed, nodes]);

  // Poster path strings (pure derivations of the build — memoized once per score).
  const poster = useMemo(
    () => ({
      aura: channelPolygon(line, width, 2.6),
      mid: channelPolygon(line, width, 1.55),
      core: channelPolygon(line, width, 1),
      hot: polylineD(line.pts.filter((_, k) => k % 3 === 0)),
      scars: scars.map((g) => ({ d: ghostPolygon(g), node: g.node })),
      delta: delta.ghosts.map((g) => ghostPolygon(g)),
    }),
    [line, width, scars, delta],
  );

  // Governed mount gate for the WebGL set-piece (desktop + motion + WebGL + in-view +
  // armed). 600px rootMargin warms the chunk + context before the stage arrives.
  const { ref: gateRef, show, inView, eligible, webglOk } = useGovernedCanvas<HTMLDivElement>({
    ref: stageRef,
    profile: "desktop-motion",
    rootMargin: "600px 0px",
    arm: true,
  });

  // Sticky mount: once the canvas has existed, keep it (pause via `running` instead of
  // unmounting — re-creating a WebGL context on every scroll-past caused Context Lost).
  const [everShown, setEverShown] = useState(false);
  if (show && !everShown) setEverShown(true);

  // `live` flips only after the async canvas chunk renders real frames — the poster
  // stays visible until that exact moment (never a dark gap).
  const [live, setLive] = useState(false);

  // Warm the heavy chunk as soon as the device qualifies.
  useEffect(() => {
    if (!(eligible && webglOk)) return;
    const t = window.setTimeout(() => {
      void import("./ArgmaxCanvas");
    }, 250);
    return () => window.clearTimeout(t);
  }, [eligible, webglOk]);

  // ONE scrubbed timeline: reveals the DOM cards, drives the HUD counter, and writes
  // the shared progress the WebGL canvas reads. Ease is "none" — inside a scrub, drama
  // belongs to the geometry (warp lives in the canvas), not to easing curves.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
        const nodeFrac = line.nodeFrac;

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
          const fromX = sides[i] === "left" ? -14 : 14;
          tl.fromTo(
            card,
            { autoAlpha: 0, yPercent: -50, y: 14, x: fromX },
            { autoAlpha: 1, yPercent: -50, y: 0, x: 0, duration: 0.13, ease: "none" },
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
    { scope: rootRef, dependencies: [n, line] },
  );

  const last = nodes[nodes.length - 1];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Live counter (aria-hidden ambient flavour). Solid surface — no backdrop-blur
          over the WebGL stage (hard gate). */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-20 z-20 mb-6 hidden justify-end md:flex"
      >
        <div className="flex items-center gap-3 rounded-full border border-line bg-base/90 px-4 py-2">
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

      {/* Aspect-locked stage (CLS=0). Poster, canvas and <ol> share this exact box. */}
      <div
        ref={gateRef}
        className="relative mx-auto w-full max-w-[1040px] md:[aspect-ratio:var(--syn-aspect)]"
        style={{ ["--syn-aspect" as string]: `${VBW} / ${VBH}` }}
      >
        {/* STATIC SVG poster — the fully-decoded artwork (SSR / reduced-motion / no-JS /
            no-WebGL / pre-arm). Decorative (aria-hidden). Fades once the canvas is live. */}
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
            <linearGradient
              id="argx-stroke"
              x1="0"
              y1="0"
              x2="0"
              y2={VBH}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="52%" stopColor="var(--color-accent-violet)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
            <radialGradient id="argx-bloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="0.9" />
              <stop offset="45%" stopColor="var(--color-accent-violet)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Collapse blooms behind the channel — sized by narrative weight. */}
          {nodes.map((p, i) => (
            <g
              key={`bloom-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-30")}
            >
              <circle r={5.5 + 7.5 * beats[i].weight} fill="url(#argx-bloom)" opacity={0.3 + 0.22 * beats[i].weight} />
            </g>
          ))}

          {/* Knowledge-graph bridges + spurs + stars — quieter than before: the bolt is
              the hero, the graph is annotation. */}
          {cnst.bridges.map((b) => (
            <path
              key={b.key}
              d={b.d}
              stroke="url(#argx-stroke)"
              strokeWidth={0.35}
              strokeLinecap="round"
              fill="none"
              opacity={0.15}
              className={cn("transition-opacity duration-300", dimmed?.(b.at) && "opacity-[0.06]")}
            />
          ))}
          {cnst.spurs.map((sp, idx) => (
            <path
              key={`spur-${idx}`}
              d={sp.d}
              stroke="url(#argx-stroke)"
              strokeWidth={0.4}
              strokeLinecap="round"
              fill="none"
              opacity={0.32}
              className={cn("transition-opacity duration-300", dimmed?.(sp.milestone) && "opacity-10")}
            />
          ))}
          {cnst.stars.map((s) => (
            <g
              key={s.key}
              transform={`translate(${s.x} ${s.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(s.milestone) && "opacity-20")}
            >
              <circle r={2.6} fill="url(#argx-bloom)" opacity={0.4} />
              <circle r={0.9} fill="var(--color-accent-cyan)" opacity={0.22} />
              <circle
                r={0.45}
                fill="var(--color-accent-cyan)"
                className="motion-safe:[animation:star-twinkle_3.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${(0.2 + (s.k % 5) * 0.5).toFixed(2)}s` }}
              />
            </g>
          ))}

          {/* SCARS — the paths not taken. Permanent, faint, tapered from full channel
              width at the root: the memory of every fork already decided. */}
          {poster.scars.map((s, idx) => (
            <path
              key={`scar-${idx}`}
              d={s.d}
              fill="url(#argx-stroke)"
              opacity={0.3}
              className={cn("transition-opacity duration-300", dimmed?.(s.node) && "opacity-[0.08]")}
            />
          ))}

          {/* THE CHANNEL — the one branch that survived, gaining caliber beat by beat.
              Aura -> mid -> core polygons + a white-hot centerline. */}
          <path d={poster.aura} fill="url(#argx-stroke)" opacity={0.09} />
          <path d={poster.mid} fill="url(#argx-stroke)" opacity={0.16} />
          <path d={poster.core} fill="url(#argx-stroke)" opacity={0.85} />
          <path d={poster.hot} stroke="#eef1ff" strokeWidth={0.3} strokeLinecap="round" opacity={0.55} />

          {/* THE OPEN DELTA — the final fork, never collapsed: live ghosts + quantized
              "still sampling" ticks fading forward. */}
          {poster.delta.map((d, idx) => (
            <path
              key={`delta-${idx}`}
              d={d}
              fill="url(#argx-stroke)"
              opacity={0.5}
              className={cn(
                "transition-opacity duration-300",
                dimmed?.(n - 1) && "opacity-20",
              )}
            />
          ))}
          {delta.ticks.map((t, idx) => (
            <circle
              key={`tick-${idx}`}
              cx={t.p.x}
              cy={t.p.y}
              r={Math.max(0.22, 0.55 - t.k * 0.06)}
              fill="var(--color-accent-cyan)"
              opacity={Math.max(0.1, 0.6 - t.k * 0.09)}
            />
          ))}

          {/* Card stems — the surviving lateral branch (decision record). */}
          {nodes.map((p, i) => {
            const targetX = LANE[sides[i]].edge;
            return (
              <path
                key={`stem-${i}`}
                d={`M ${p.x} ${p.y} H ${targetX}`}
                stroke="url(#argx-stroke)"
                strokeWidth={0.5}
                strokeLinecap="round"
                strokeDasharray="0.8 2.4"
                opacity={0.55}
                className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-20")}
              />
            );
          })}

          {/* Decision beads — sized by narrative weight (not one-size-fits-all). */}
          {nodes.map((p, i) => (
            <g
              key={`node-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className={cn("transition-opacity duration-300", dimmed?.(i) && "opacity-40")}
            >
              <circle
                r={1.7 + 1.9 * beats[i].weight}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={0.35}
                opacity={0.3}
              />
              <circle r={0.75 + 1.05 * beats[i].weight} fill="var(--color-accent-cyan)" />
            </g>
          ))}
        </svg>

        {/* The live WebGL set-piece — desktop / motion / WebGL / armed only. Mounts when
            first near view, then STAYS mounted (frameloop pauses off-view instead). */}
        {(everShown || show) && (
          <ArgmaxFiber
            vbw={VBW}
            vbh={VBH}
            build={build}
            beats={beats}
            stars={cnst.stars}
            spurs={cnst.spurs}
            bridges={cnst.bridges}
            progressRef={progressRef}
            mask={mask}
            running={inView}
            onLive={() => setLive(true)}
          />
        )}

        {/* Delta caption — DOM (crisp type), persists over poster AND live canvas. */}
        {caption && last ? (
          <div
            aria-hidden
            className="pointer-events-none absolute hidden -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim/80 md:block"
            style={{
              left: `${(last.x / VBW) * 100}%`,
              top: `${((last.y + 20) / VBH) * 100}%`,
            }}
          >
            {caption}
          </div>
        ) : null}

        {/* The accessible content: ONE real <ol>. Mobile = left-rail stacked list; md+
            places each card on the OUTER side of its decision node (CSS top:%, CLS=0). */}
        <ol
          className={cn(
            "relative space-y-5 pl-7 md:absolute md:inset-0 md:space-y-0 md:pl-0",
            "before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px md:before:hidden",
            "before:bg-gradient-to-b before:from-accent/45 before:via-accent-violet/35 before:to-accent-cyan/45",
          )}
        >
          {nodes.map((p, i) => {
            const side = sides[i];
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
