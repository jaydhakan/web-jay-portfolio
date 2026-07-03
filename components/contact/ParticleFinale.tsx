"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useGovernedCanvas } from "@/lib/webgl-governance";

const ParticleFinaleCanvas = dynamic(() => import("./ParticleFinaleCanvas"), { ssr: false });

/**
 * GPU particle finale (V3 P11 / S12) — a full-bleed band that closes /contact.
 * Tens of thousands of particles assemble into the finale wordmark and repel
 * from the cursor. The wordmark also ships as a real, visible DOM heading
 * underneath: it is the SSR / a11y / no-JS / reduced-motion / no-WebGL layer,
 * and the particle canvas (desktop + motion + WebGL + in-view only) fades in
 * over it. Lazy, governed, one route.
 */
export function ParticleFinale({ text, tagline }: { text: string; tagline: string }) {
  // Scroll-driven set-piece (no cursor dependency) -> "desktop-motion".
  const { ref, show, inView } = useGovernedCanvas<HTMLElement>({
    profile: "desktop-motion",
    rootMargin: "200px 0px",
  });

  // Sticky mount + frameloop pause off-view: the finale sits beside the footer, so
  // the gate flaps as visitors bounce around the page end — re-creating the WebGL
  // context on every flap risks Context Lost. Mount once, pause when away.
  // Guarded render-time latch (the docs-blessed "adjust state during render" idiom).
  const [everShown, setEverShown] = useState(false);
  if (show && !everShown) setEverShown(true);

  // The wordmark ghosts ONLY once particles actually draw (the canvas chunk is
  // async — ghosting on the mount gate leaves a near-invisible heading in the gap).
  const [live, setLive] = useState(false);

  return (
    <section
      ref={ref}
      className="relative mt-24 flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl border border-line bg-base py-20"
    >
      {/* Particle canvas (desktop + motion + WebGL). */}
      {(everShown || show) && (
        <div aria-hidden className="absolute inset-0 animate-[rise-in_1s_ease-out_both]">
          <ParticleFinaleCanvas text={text} running={inView} onLive={() => setLive(true)} />
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
            (live ? "opacity-[0.08]" : "opacity-100")
          }
        >
          {text}
        </h2>
        <p className="mt-6 text-base text-ink-dim sm:text-lg">{tagline}</p>
      </div>
    </section>
  );
}
