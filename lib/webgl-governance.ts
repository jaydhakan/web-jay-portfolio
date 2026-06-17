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
import { useEffect, useState } from "react";

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
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
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
