"use client";

/**
 * GSAP registration point (plan.md §6.1). Import gsap / useGSAP / ScrollTrigger
 * from here — never from "gsap" directly — so the jdFlow ease + DUR scale are
 * always available.
 *
 * PERF (Phase 9): only the core + ScrollTrigger + CustomEase are registered
 * eagerly (they drive every scroll reveal and the signature ease, and nothing
 * above the fold needs more). The heavy/specialized plugins — SplitText,
 * DrawSVG, Flip, ScrambleText — were the bulk of the initial GSAP chunk (~1.6s
 * to evaluate on a 4x-CPU phone) and are now lazy-loaded as a single chunk after
 * mount. Consumers read useExtraPlugins() and create their tweens SYNCHRONOUSLY
 * inside useGSAP once it flips true, so the GSAP context still auto-reverts them
 * (no async-created, un-tracked tweens — keeps the leak-free guarantee).
 *
 * GSAP 3.13+ ships every former-premium plugin free in the public package.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useSyncExternalStore } from "react";
import type { SplitText as SplitTextClass } from "gsap/SplitText";
import type { Flip as FlipClass } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

if (!CustomEase.get?.("jdFlow")) {
  // Signature ease — reserved for the wipe/panel/line-draw family only.
  CustomEase.create("jdFlow", "M0,0 C0.7,0 0.18,1 1,1");
}

/** The only three durations on the site (spec §4.3). */
export const DUR = { micro: 0.4, std: 0.8, hero: 1.2 } as const;

// --- Lazy plugins -----------------------------------------------------------

let splitText: typeof SplitTextClass | null = null;
let flip: typeof FlipClass | null = null;
let ready = false;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Load + register the heavy plugins once. Idempotent; returns a shared promise. */
export function loadExtraPlugins(): Promise<void> {
  if (!pending) {
    pending = Promise.all([
      import("gsap/SplitText"),
      import("gsap/DrawSVGPlugin"),
      import("gsap/Flip"),
      import("gsap/ScrambleTextPlugin"),
    ]).then(([st, draw, fl, scr]) => {
      gsap.registerPlugin(st.SplitText, draw.DrawSVGPlugin, fl.Flip, scr.ScrambleTextPlugin);
      splitText = st.SplitText;
      flip = fl.Flip;
      ready = true;
      for (const l of listeners) l();
    });
  }
  return pending;
}

/** Reactive readiness for the lazy plugins; kicks the load on first subscribe. */
export function useExtraPlugins(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      void loadExtraPlugins();
      return () => listeners.delete(cb);
    },
    () => ready,
    () => false,
  );
}

/** The SplitText class — non-null only after useExtraPlugins() is true. */
export function getSplitText() {
  return splitText;
}
/** The Flip class — non-null only after the extra plugins have loaded. */
export function getFlip() {
  return flip;
}

export { gsap, useGSAP, ScrollTrigger };
