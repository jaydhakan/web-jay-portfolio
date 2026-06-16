"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const HeroShader = dynamic(() => import("./HeroShader"), { ssr: false });

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl() {
  if (webglProbe === null) {
    const canvas = document.createElement("canvas");
    webglProbe = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  }
  return webglProbe;
}

/**
 * Mount gate for the shader: skipped under reduced motion or missing WebGL
 * (the CSS gradient fallback underneath stays), deferred until the page has
 * loaded and the main thread is idle (keeps the three/R3F init out of the load
 * window so it stops dominating TBT), and unmounted while scrolled past the
 * hero so the GPU goes idle on the rest of the page.
 */
export function HeroBackground() {
  // Resolve reduced motion once before first paint (stable for the mount).
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const ref = useRef<HTMLDivElement>(null);
  // Mount/unmount the shader as the hero enters/leaves view (so the GPU idles on
  // the rest of the page). IntersectionObserver replaces Motion's useInView.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // false during SSR/hydration, cached WebGL probe on the client.
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);

  // The shader is a heavy, continuously-rendering WebGL layer (R3F runs a rAF
  // loop while mounted). Mounting it during load keeps the main thread busy
  // through the whole measurement window, so it never goes idle and TBT/TTI
  // collapse. Instead, arm it on the first real user interaction: the
  // always-painted .hero-fallback gradient is the experience until then, and
  // the shader fades in on the first move/scroll/touch. This also keeps the
  // WebGL init from competing with hydration on real devices. setState runs in
  // event callbacks, so the strict set-state-in-effect lint is satisfied.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (reduceMotion || !webglOk) return;
    const events = ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "scroll"];
    function arm() {
      setArmed(true);
      for (const ev of events) window.removeEventListener(ev, arm);
    }
    for (const ev of events) window.addEventListener(ev, arm, { passive: true });
    return () => {
      for (const ev of events) window.removeEventListener(ev, arm);
    };
  }, [reduceMotion, webglOk]);

  const showShader = !reduceMotion && webglOk && inView && armed;

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 -z-10">
      {showShader && (
        <div className="size-full animate-[rise-in_1.2s_ease-out_both]">
          <HeroShader />
        </div>
      )}
    </div>
  );
}
