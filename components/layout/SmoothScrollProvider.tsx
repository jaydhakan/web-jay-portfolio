"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import type Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Smooth-scroll root (plan.md §6.2). Drives Lenis's rAF off the GSAP ticker so
 * scroll-linked tweens and ScrollTrigger stay frame-synced with one loop.
 *
 * Reduced motion → no Lenis at all: native scroll, no ticker hook. The context
 * then exposes `null`, and consumers (Header smart-hide, anchor scroll) fall
 * back to window scroll.
 *
 * CRITICAL: options.autoRaf MUST be false — otherwise Lenis runs its own rAF
 * loop in addition to the ticker-driven one and you get doubled / janky scroll.
 */

const LenisInstanceContext = createContext<Lenis | null>(null);

/** Read the active Lenis instance (null under reduced motion / native scroll). */
export function useLenisInstance() {
  return useContext(LenisInstanceContext);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  // Resolve reduced-motion once, before first paint, so the branch is stable
  // for the lifetime of the provider (lazy initializer runs a single time).
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const lenisRef = useRef<LenisRef>(null);
  const [instance, setInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduce) return; // native scroll path

    const lenis = lenisRef.current?.lenis ?? null;
    setInstance(lenis);

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const onScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onScroll);

    return () => {
      // Named callback removal; ReactLenis owns the Lenis destroy() itself.
      gsap.ticker.remove(update);
      lenis?.off("scroll", onScroll);
    };
  }, [reduce]);

  if (reduce) {
    return (
      <LenisInstanceContext.Provider value={null}>{children}</LenisInstanceContext.Provider>
    );
  }

  return (
    <ReactLenis
      root
      options={{ lerp: 0.09, wheelMultiplier: 1.1, autoRaf: false, syncTouch: false }}
      ref={lenisRef}
    >
      <LenisInstanceContext.Provider value={instance}>
        {children}
      </LenisInstanceContext.Provider>
    </ReactLenis>
  );
}
