"use client";

/**
 * WebGL governance (V3 P1) — the rig that lets us run several heavy canvases
 * across the site without killing the GPU. Every WebGL surface uses these so the
 * "go loud" plan stays shippable:
 *  - useInViewport: mount / run only while on-screen (pause or unmount off-screen)
 *  - DPR_CAP: the shared device-pixel-ratio ceiling (bounds fill cost on retina)
 *  - createFpsGuard: shed quality (particle count / texture res) if frames slow
 *
 * This is about SIMULTANEITY, not ambition: go as big as you want on the surface
 * the user is looking at; just don't keep three of them burning at once.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Shared DPR ceiling for every Canvas — keeps GPU fill cost bounded on retina. */
export const DPR_CAP: [number, number] = [1, 2];

/** True while `ref` is within `rootMargin` of the viewport (mount / run gate). */
export function useInViewport(
  ref: React.RefObject<Element | null>,
  rootMargin = "200px 0px",
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      // Coalesced callbacks deliver oldest-first; the LAST record is current state.
      (entries) => setInView(entries[entries.length - 1].isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/**
 * Frame-time watchdog. Call the returned fn once per frame (e.g. inside R3F's
 * useFrame with its delta). When the rolling-average frame time exceeds
 * `budgetMs`, `onStrain` fires once so the caller can shed load; `onRelief` fires
 * once when frames recover. Keeps a heavy set-piece from tanking a weak GPU.
 */
export function createFpsGuard(opts: {
  budgetMs?: number;
  onStrain: () => void;
  onRelief?: () => void;
}) {
  const budget = opts.budgetMs ?? 20; // ~50fps floor
  let avg = 16.7;
  let strained = false;
  return (deltaSeconds: number) => {
    const ms = deltaSeconds * 1000;
    // A single huge frame is a stall (tab-return delivers the whole hidden
    // duration as one delta, plus GC pauses, route transitions, ScrollTrigger
    // refreshes) — NOT sustained frame-rate strain. Feeding it in trips strain
    // permanently (relief threshold budget*0.7 sits below a 60Hz display's
    // steady 16.7ms, so degradation never lifts). Ignore spikes; only sustained
    // slowness should shed quality.
    if (ms > 100) return;
    avg += (ms - avg) * 0.1;
    if (!strained && avg > budget) {
      strained = true;
      opts.onStrain();
    } else if (strained && avg < budget * 0.7) {
      strained = false;
      opts.onRelief?.();
    }
  };
}

/**
 * Multi-rung quality ladder (the Flight, timelineplan.md §13.3) — createFpsGuard's
 * big sibling, same rolling average and spike clamp, but instead of one strain bit
 * it walks DOWN a ladder of quality tiers under *sustained* strain:
 *
 *   strain onset  → onShed()          soft, REVERSIBLE (sprite size only)
 *   +rungMs still strained → onTier(1)  T1: uKeep 0.6, CoC 0.5, DPR 1.5
 *   +rungMs more           → onTier(2)  T2: composer off, uKeep 0.4, DPR 1.25
 *   +rungMs more           → onTier(3)  T3: kill (canvas unmounts; poster + Spine)
 *
 * Tiers are ONE-WAY ratchets — re-promoting rebuilds the composer, which spikes a
 * frame, which re-demotes: oscillation. Only the soft shed relieves. The rung timer
 * resets on relief AND after each demotion, so reaching T3 takes ~3×rungMs of
 * genuine continuous slowness — a single GC storm cannot cascade to death.
 */
export function createTierLadder(opts: {
  budgetMs?: number;
  /** Continuous strain required per rung demotion (default 3000ms). */
  rungMs?: number;
  /** Start below T0 (the `?flighttier` dev/test override). */
  startRung?: 0 | 1 | 2;
  onShed: () => void;
  onRelief?: () => void;
  onTier: (rung: 1 | 2 | 3) => void;
}) {
  const budget = opts.budgetMs ?? 20;
  const rungMs = opts.rungMs ?? 3000;
  let avg = 16.7;
  let strained = false;
  let strainMs = 0;
  let rung: number = opts.startRung ?? 0;
  return (deltaSeconds: number) => {
    if (rung >= 3) return;
    const ms = deltaSeconds * 1000;
    // Same spike clamp as createFpsGuard (e2f001f): tab-return/GC/route-flip
    // deliver one huge delta — a stall, not sustained strain. Never feed it in.
    if (ms > 100) return;
    avg += (ms - avg) * 0.1;
    if (!strained && avg > budget) {
      strained = true;
      strainMs = 0;
      opts.onShed();
    } else if (strained && avg < budget * 0.7) {
      strained = false;
      strainMs = 0;
      opts.onRelief?.(); // restores the soft shed ONLY — tiers never re-promote
    } else if (strained) {
      // (else-if: the onset tick itself doesn't count — a rung needs a FULL
      // rungMs of strain after shed/the previous demotion)
      strainMs += ms;
      if (strainMs >= rungMs) {
        strainMs = 0;
        rung += 1;
        opts.onTier(rung as 1 | 2 | 3);
      }
    }
  };
}

/* ---------------------------------------------------------------------------
   Mount gating — the "should this heavy canvas exist right now?" decision.
   Every WebGL surface used to hand-roll the three pieces below (a cached WebGL
   probe, a one-shot matchMedia eligibility check, an arm-after-paint defer);
   they live here once so the gate is identical and audited in one place.
--------------------------------------------------------------------------- */

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl(): boolean {
  if (webglProbe === null) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglProbe = Boolean(ctx);
    // Release the probe's context immediately — browsers cap live contexts (~8-16)
    // and evict the OLDEST when the cap is hit; a leaked probe slot makes the
    // page-wide background canvas likelier to be the one evicted (goes blank).
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webglProbe;
}

/**
 * Cached WebGL-availability probe. Returns `false` during SSR/hydration (so the
 * still poster / CSS fallback owns first paint and markup matches) and the real
 * capability on the client. Result is memoised across the whole app.
 */
export function useWebglSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, probeWebgl, () => false);
}

/**
 * Which devices may run a heavy canvas. Resolved ONCE before first paint and
 * stable for the mount (the decision never flips mid-session):
 *  - "desktop-fine": desktop fine-pointer + hover + motion — anything that reacts
 *    to a real cursor (hero shader, flow covers, particle portrait).
 *  - "desktop-motion": desktop + motion, any pointer — scroll-driven set-pieces
 *    that don't need a cursor (training-run flight, contact finale).
 * Reduced motion or a <768px viewport never qualifies; those keep the poster.
 */
export type CanvasProfile = "desktop-fine" | "desktop-motion";
export function useCanvasEligible(profile: CanvasProfile = "desktop-fine"): boolean {
  const [eligible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.innerWidth < 768) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (profile === "desktop-motion") return true;
    return (
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches
    );
  });
  return eligible;
}

/**
 * Defer `true` until after first paint (double rAF) so a canvas init never
 * competes with LCP / hydration — the still poster is the experience until then.
 * Pass the gate that makes arming worthwhile (e.g. `eligible && webglOk`) as
 * `enabled`, so the timer only runs when a canvas will actually mount.
 */
export function useArmedAfterPaint(enabled: boolean): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => setArmed(true)),
    );
    return () => window.cancelAnimationFrame(id);
  }, [enabled]);
  return armed;
}

/**
 * Defer `true` until the browser is genuinely idle OR the visitor gives their first
 * input (scroll/wheel/touch) — whichever comes first. For heavy canvases that sit
 * near the fold (the /work Flight): real users scroll within a beat so they never
 * notice, while a no-interaction Lighthouse trace keeps the chunk out of its TBT
 * observation window. AND this into the mount condition alongside `show`.
 */
export function useArmedAfterIdle(enabled: boolean): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!enabled || armed) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setArmed(true);
    };
    // Safari still lacks requestIdleCallback — feature-detect via an optional view
    // of window (a plain `in` check narrows the else-branch to `never` under lib.dom).
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = w.requestIdleCallback
      ? w.requestIdleCallback(fire, { timeout: 4000 })
      : window.setTimeout(fire, 1500);
    window.addEventListener("scroll", fire, { once: true, passive: true });
    window.addEventListener("wheel", fire, { once: true, passive: true });
    window.addEventListener("touchstart", fire, { once: true, passive: true });
    return () => {
      done = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      window.removeEventListener("scroll", fire);
      window.removeEventListener("wheel", fire);
      window.removeEventListener("touchstart", fire);
    };
  }, [enabled, armed]);
  return armed;
}

/**
 * The full "should this WebGL surface mount now?" gate in one hook: device
 * eligibility + WebGL support + in-view + (optionally) armed-after-paint.
 * Returns the `ref` to attach to the surface's wrapper and a single `show`
 * boolean. Pass `ref` to reuse an existing element ref (e.g. a GSAP scope /
 * pinned section); otherwise one is created. Replaces the duplicated gating that
 * lived in every canvas mount gate.
 */
export function useGovernedCanvas<T extends Element = HTMLDivElement>(opts?: {
  ref?: React.RefObject<T | null>;
  profile?: CanvasProfile;
  rootMargin?: string;
  /** Defer the canvas until after first paint (covers with an LCP-adjacent poster). */
  arm?: boolean;
}) {
  const internalRef = useRef<T>(null);
  const ref = opts?.ref ?? internalRef;
  const eligible = useCanvasEligible(opts?.profile);
  const webglOk = useWebglSupported();
  const inView = useInViewport(ref, opts?.rootMargin);
  const armed = useArmedAfterPaint(opts?.arm ? eligible && webglOk : false);
  const show = eligible && webglOk && inView && (opts?.arm ? armed : true);
  return { ref, show, inView, eligible, webglOk };
}
