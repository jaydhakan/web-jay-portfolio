"use client";

/**
 * The velocity bus (V3 P1). ONE shared, per-frame motion signal read off Lenis
 * and broadcast to everything that should "move with the page" — the marquee
 * streak, headline skew, shader uniforms, etc. (plan.md S2, "one velocity bus").
 *
 * Design: imperative, NOT React state. Consumers subscribe a per-frame callback
 * and write to the DOM / uniforms directly (style writes, gsap.quickTo) — so the
 * bus drives 60fps motion without ever re-rendering React. `velocity` is smoothed
 * (eased toward the raw scroll velocity) and decays to 0 when scrolling stops, so
 * a consumer can lerp without bookkeeping.
 *
 * The decay tick rides the GSAP ticker (the same loop that drives Lenis) and runs
 * only while there is at least one subscriber, so it costs nothing on routes that
 * don't use it. Under reduced motion nothing subscribes and the signal stays 0.
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export type VelocitySignal = {
  /** Smoothed, signed scroll velocity (eased toward raw, decays to 0 at rest). */
  velocity: number;
  /** Page scroll progress, 0..1. */
  progress: number;
  /** Scroll direction: -1 up, 1 down, 0 at rest. */
  direction: number;
};

const signal: VelocitySignal = { velocity: 0, progress: 0, direction: 0 };
let rawVelocity = 0;
const listeners = new Set<(s: VelocitySignal) => void>();
let running = false;

function tick() {
  signal.velocity += (rawVelocity - signal.velocity) * 0.18;
  rawVelocity *= 0.9; // decay so a scroll-stop eases the signal back to rest
  if (Math.abs(signal.velocity) < 0.0005) signal.velocity = 0;
  for (const l of listeners) l(signal);
}

/** Feed the bus from the scroll source (the SmoothScrollProvider Lenis callback). */
export function publishScroll(data: Partial<VelocitySignal>) {
  if (data.velocity !== undefined) rawVelocity = data.velocity;
  if (data.progress !== undefined) signal.progress = data.progress;
  if (data.direction !== undefined) signal.direction = data.direction;
}

/** Current snapshot (mutated in place; treat as read-only). */
export function getVelocitySignal(): Readonly<VelocitySignal> {
  return signal;
}

/** Live subscriber count — dev leak tripwire only. */
export function velocityListenerCount() {
  return listeners.size;
}

/**
 * Subscribe a per-frame callback to the bus (imperative; not a React hook). For
 * non-React consumers — the shader uniforms, an R3F useFrame bridge, etc. Returns
 * an unsubscribe fn. The decay tick runs only while there is >=1 subscriber.
 */
export function subscribeVelocity(cb: (s: VelocitySignal) => void) {
  listeners.add(cb);
  if (!running) {
    gsap.ticker.add(tick);
    running = true;
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && running) {
      gsap.ticker.remove(tick);
      running = false;
    }
  };
}

/**
 * Subscribe a per-frame callback to the bus for the component's lifetime. The
 * callback receives the live signal each frame — do imperative DOM/uniform writes
 * in it, never setState. The latest callback is always used (ref-stored), so an
 * inline closure is fine. No-op under reduced motion.
 */
export function useVelocityFrame(cb: (s: VelocitySignal) => void, enabled = true) {
  const cbRef = useRef(cb);
  // Keep the ref pointed at the latest callback (updated after render, not during).
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return subscribeVelocity((s) => cbRef.current(s));
  }, [enabled]);
}
