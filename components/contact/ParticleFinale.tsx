"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useInViewport } from "@/lib/webgl-governance";

const ParticleFinaleCanvas = dynamic(() => import("./ParticleFinaleCanvas"), { ssr: false });

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl() {
  if (webglProbe === null) {
    const c = document.createElement("canvas");
    webglProbe = Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  }
  return webglProbe;
}

/**
 * GPU particle finale (V3 P11 / S12) — a full-bleed band that closes /contact.
 * Tens of thousands of particles assemble into the finale wordmark and repel
 * from the cursor. The wordmark also ships as a real, visible DOM heading
 * underneath: it is the SSR / a11y / no-JS / reduced-motion / no-WebGL layer,
 * and the particle canvas (desktop + motion + WebGL + in-view only) fades in
 * over it. Lazy, governed, one route.
 */
export function ParticleFinale({ text, tagline }: { text: string; tagline: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const [eligible] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth >= 768 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  });
  const inView = useInViewport(ref, "200px 0px");
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);
  const show = eligible && webglOk && inView;

  return (
    <section
      ref={ref}
      className="relative mt-24 flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl border border-line bg-base py-20"
    >
      {/* Particle canvas (desktop + motion + WebGL). */}
      {show && (
        <div aria-hidden className="absolute inset-0 animate-[rise-in_1s_ease-out_both]">
          <ParticleFinaleCanvas text={text} />
        </div>
      )}

      {/* Authoritative wordmark — visible everywhere; under the particles it reads
          as the "settled" target the cloud forms. On the particle path it is dimmed
          so the cloud leads (the canvas covers it), but it stays the a11y text. */}
      <div className="relative z-10 px-6 text-center">
        <h2
          className={
            "font-display text-[clamp(2.5rem,11vw,8rem)] font-black uppercase leading-none tracking-tight text-ink transition-opacity duration-700 " +
            // Faint ghost under the particles (the target the cloud settles into);
            // full strength otherwise. Never fully hidden -> a visible wordmark
            // always renders even if the GPU path is unavailable.
            (show ? "opacity-[0.08]" : "opacity-100")
          }
        >
          {text}
        </h2>
        <p className="mt-6 text-base text-ink-dim sm:text-lg">{tagline}</p>
      </div>
    </section>
  );
}
