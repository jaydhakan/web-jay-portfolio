"use client";

import { useEffect, useRef } from "react";
import { FlightEngine } from "@/lib/flight/engine";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";
import type { FlightItem } from "@/lib/flight/types";

/**
 * The canvas + the engine's lifetime.
 *
 * This component is a LIFECYCLE WRAPPER, nothing more: it renders the <canvas>,
 * constructs the engine once, and tears it down on unmount. All rendering lives
 * in lib/flight/engine.ts.
 *
 * SCROLL AUTHORITY: reads and writes go through Lenis when it is active, so the
 * flight shares one scroll authority with the rest of the site (Header
 * smart-hide, ScrollProgress, AnchorScroll) instead of racing it with raw
 * window.scrollY / scrollTo. Under reduced motion Lenis is absent by design and
 * both fall back to native scroll.
 *
 * The engine is created ONCE per mount and is deliberately NOT re-created when
 * `filter` changes — the filter is pushed in imperatively. Re-creating it would
 * rebuild every beacon and restart the flight mid-scroll.
 */
export function FlightCanvas({
  rootRef,
  items,
  filter,
  onStation,
  engineRef,
  debug,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  items: FlightItem[];
  filter: string;
  onStation?: (index: number, item: FlightItem) => void;
  engineRef?: React.RefObject<FlightEngine | null>;
  debug?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);

  // Latest-value refs, declared and synced BEFORE the mount effect that closes
  // over them. The engine reads them lazily every frame, so neither a new
  // callback identity nor Lenis attaching late can re-create the engine — and
  // re-creating it would rebuild every beacon and restart the flight mid-scroll.
  const onStationRef = useRef(onStation);
  const lenis = useLenisInstance();
  const lenisRef = useRef(lenis);
  useEffect(() => {
    onStationRef.current = onStation;
    lenisRef.current = lenis;
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const engine = new FlightEngine({
      root,
      canvas,
      items,
      getScroll: () => (lenisRef.current ? lenisRef.current.scroll : window.scrollY),
      scrollTo: (y, immediate) => {
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(y, { immediate });
        else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
      },
      onStation: (i, item) => onStationRef.current?.(i, item),
      getDebugEl: () => debugRef.current,
    });
    if (engineRef) engineRef.current = engine;
    // Dev affordance, gated behind ?flightdebug=1 alongside the FPS overlay:
    // exposes the live engine for poking at frame counts / park state.
    const devFlag =
      new URLSearchParams(window.location.search).get("flightdebug") === "1";
    if (devFlag) (window as unknown as { __flight?: FlightEngine }).__flight = engine;
    engine.mount();

    return () => {
      engine.destroy();
      if (engineRef) engineRef.current = null;
      if (devFlag) delete (window as unknown as { __flight?: FlightEngine }).__flight;
    };
    // `items` is a module-level constant per route; `debug` is a static query
    // read. Neither changes across a mount, and re-running would restart the
    // flight mid-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push the filter in imperatively — no rebuild, no re-render of the cards.
  useEffect(() => {
    engineRef?.current?.setFilter(filter);
  }, [filter, engineRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 z-0 block size-full"
      />
      {debug && (
        <div
          ref={debugRef}
          aria-hidden
          className="pointer-events-none absolute right-3 top-20 z-20 rounded-md bg-black/70 px-2.5 py-1.5 font-mono text-[10px] tabular-nums text-ok"
        />
      )}
    </>
  );
}
