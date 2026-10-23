"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FlightEngine } from "@/lib/flight/engine";
import type { FlightFilter, FlightItem } from "@/lib/flight/types";
import { FlightCanvas } from "@/components/flight/FlightCanvas";
import { FlightHUD } from "@/components/flight/FlightHUD";
import { FlightRail } from "@/components/flight/FlightRail";
import { HoloCard } from "@/components/flight/HoloCard";
import { cn } from "@/lib/utils";

/**
 * The Flight — orchestrator.
 *
 * LAYOUT (the load-bearing deviation from the design prototype): the prototype
 * owned the whole document — a position:fixed canvas plus a 900vh spacer, with
 * the camera driven by `scrollY / range`. That can only ever be a whole page.
 * Here the flight is a STICKY SECTION instead: the <section> is the scroll
 * runway (its height is set by the engine from the item count) and the sticky
 * child is the stage. The camera reads section-relative progress, so the maths
 * is untouched (fp is still 0..1) but /about can keep its headshot, bio, toolkit
 * and CTA around the flight instead of being consumed by it.
 *
 * STATE: React owns STRUCTURE (which cards exist, which filter button is on).
 * The engine owns PRESENTATION (where every card is, every frame). The filter is
 * pushed into the engine imperatively rather than re-rendering the card tree,
 * because rebuilding nine backdrop-filtered nodes mid-flight drops frames.
 */

/** The debug flag cannot change within a session, so the store never notifies. */
const NEVER_CHANGES = () => () => {};

export type FlightStageProps = {
  items: FlightItem[];
  /** Copy for the intro headline. */
  eyebrow: string;
  headline: readonly [string, string];
  /** h1 on /work (the flight IS the page header); h2 on /about (h1 is above). */
  headingLevel?: "h1" | "h2";
  /** Category filter — omit for /about. */
  filter?: FlightFilter;
  /** Anchor of the fallback list, for the skip link. */
  fallbackId: string;
  className?: string;
};

export function FlightStage({
  items,
  eyebrow,
  headline,
  headingLevel = "h1",
  filter,
  fallbackId,
  className,
}: FlightStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const engineRef = useRef<FlightEngine | null>(null);
  const [active, setActive] = useState(filter ? filter.options[0] : "All");

  /**
   * Dev FPS overlay flag, read from the URL in an effect rather than through
   * useSearchParams.
   *
   * LOAD-BEARING: useSearchParams opts the whole subtree out of prerendering,
   * which meant /work shipped its <h1> only after hydration — no heading for
   * crawlers or no-JS, and the LCP headline gated behind JS. Reading
   * window.location in an effect keeps this page fully static.
   */
  const debug = useSyncExternalStore(
    NEVER_CHANGES,
    () => new URLSearchParams(window.location.search).get("flightdebug") === "1",
    () => false, // server snapshot — the overlay is client-only by definition
  );

  const Heading = headingLevel;

  const jump = useCallback((i: number) => engineRef.current?.jumpTo(i), []);

  /**
   * Deep links: /work#station-3 (or ?station=3) lands the camera on a station.
   *
   * Runs once, deferred past the route-reset that PageTransition performs on
   * every navigation (it scrolls to top) — otherwise the restore is immediately
   * undone. Only fires when a station is actually requested.
   */
  useEffect(() => {
    const fromHash = /^#station-(\d+)$/.exec(window.location.hash)?.[1];
    const fromQuery = new URLSearchParams(window.location.search).get("station");
    const raw = fromHash ?? fromQuery;
    if (!raw) return;
    const index = Number(raw) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return;

    // Two rAFs past the route-reset, then a beat for the engine's deferred
    // build (it defers 32ms so a throwing build can still clear the overlay).
    let t = 0;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => {
        t = window.setTimeout(() => engineRef.current?.snapTo(index), 120);
      });
      frames.push(r2);
    });
    const frames: number[] = [r1];
    return () => {
      for (const f of frames) cancelAnimationFrame(f);
      clearTimeout(t);
    };
    // Mount-only: a later hash change is handled by the browser, and re-running
    // would yank the camera while the user is flying.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Keep the URL pointed at the station in view, so the address bar is always
   * shareable. replaceState (never pushState) — flying must not fill the
   * history stack with nine entries you then have to back out of.
   */
  const onStation = useCallback((index: number) => {
    const hash = `#station-${index + 1}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }, []);

  return (
    <section
      ref={rootRef}
      // Height is set by the engine from the item count (and collapsed to 0
      // below the flight breakpoint), so it can never be wrong for a dataset.
      className={cn("relative", className)}
    >
      {/* Visible-on-focus skip link — the first focusable element in the flight. */}
      <a
        href={`#${fallbackId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-1/2 focus:top-4 focus:z-50 focus:-translate-x-1/2 focus:rounded-full focus:bg-accent-solid focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip the flight — jump to the list
      </a>

      <div
        data-flight-stage
        className="sticky top-0 h-[100dvh] w-full overflow-hidden"
      >
        {/* Nebula: a pure-CSS field behind the canvas, parallaxed on the
            compositor by the engine. Costs nothing per frame and is also the
            reduced-motion / build-failed backdrop. */}
        <div
          data-flight-nebula
          aria-hidden
          className="flight-fallback pointer-events-none absolute inset-0 z-0 will-change-transform"
        />

        <FlightCanvas
          rootRef={rootRef}
          items={items}
          filter={active}
          onStation={onStation}
          engineRef={engineRef}
          debug={debug}
        />

        {/* Intro: cross-faded out across the LEAD window by the engine. */}
        <div
          data-flight-intro
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-10 pb-10 pt-26 text-center"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold tracking-[0.26em] text-accent-violet">
            {eyebrow}
          </p>
          <Heading className="m-0 font-display text-[clamp(38px,5.4vw,84px)] font-bold leading-[1.04] tracking-[-0.035em] text-ink">
            {headline[0]}
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-violet to-accent-cyan bg-clip-text text-transparent">
              {headline[1]}
            </span>
          </Heading>
          <p className="mt-8 font-mono text-[9px] tracking-[0.3em] text-ink-dim">
            SCROLL TO FLY · ← → TO JUMP STATIONS
          </p>
        </div>

        {/* Card layer. aria-hidden + tabIndex={-1} inside: a decorative
            duplicate of the fallback list (see HoloCard). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[6]">
          {items.map((item, i) => (
            <HoloCard key={item.id} item={item} index={i} />
          ))}
        </div>

        <FlightRail items={items} onJump={jump} />
        <FlightHUD count={items.length} />

        {/* Category filter (/work only). */}
        {filter && (
          <div
            data-flight-filters
            role="group"
            aria-label={filter.label}
            className="absolute left-1/2 top-20 z-[8] flex -translate-x-1/2 flex-wrap justify-center gap-2 px-4"
          >
            {filter.options.map((option) => {
              const on = option === active;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(option)}
                  className={cn(
                    "focus-pill rounded-full border px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.1em] transition-[color,background-color,border-color,scale] duration-300 active:scale-95 active:duration-100",
                    on
                      ? "border-accent-cyan bg-accent-cyan/12 text-accent-cyan"
                      : "border-line bg-base/50 text-ink-dim hover:border-accent/40 hover:text-ink",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Boot overlay: scoped to the STAGE, not the page (the prototype's was
            full-screen, which would black out /about's bio). Fades on the first
            painted frame, with a 1.5s hard timeout so it can never strand the
            page — and a build that throws still clears it. */}
        <div
          data-flight-boot
          aria-hidden
          className="absolute inset-0 z-[9] flex flex-col items-center justify-center gap-4 bg-base transition-opacity duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)]"
        >
          <span className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            JD<span className="text-accent-cyan">◆</span>
          </span>
          <span className="block h-0.5 w-[180px] overflow-hidden rounded-sm bg-white/10">
            <span className="animate-boot-sweep block size-full bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
          </span>
          <span className="font-mono text-[9.5px] tracking-[0.24em] text-ink-dim">
            PREPARING FLIGHT PATH
          </span>
        </div>
      </div>
    </section>
  );
}
