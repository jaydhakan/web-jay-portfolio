"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useInViewport } from "@/lib/webgl-governance";
import { SectionLabel } from "@/components/ui/SectionLabel";

const TrainingRunCanvas = dynamic(() => import("./TrainingRunCanvas"), { ssr: false });

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl() {
  if (webglProbe === null) {
    const c = document.createElement("canvas");
    webglProbe = Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  }
  return webglProbe;
}

type Epoch = { tag: string; title: string; body: string };

/**
 * Camera-flight "training run" (V3 P10 / S8). Pins a full-viewport 3D stage and
 * turns vertical scroll into a camera flight through a skill/knowledge graph
 * (TrainingRunCanvas) while the epoch captions resolve char-by-char at their
 * scroll windows. Desktop + motion + WebGL only; reduced motion / mobile / no-JS
 * get a static stacked caption list (the copy is always real DOM text, so a11y
 * is unchanged). The flight progress is pushed to the canvas via a ref (no React
 * re-render); the canvas is mounted only while the pinned stage is in view.
 */
export function TrainingRun({ eyebrow, heading, epochs }: { eyebrow: string; heading: string; epochs: Epoch[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);

  const [eligible] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth >= 768 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  });
  const inView = useInViewport(rootRef, "300px 0px");
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);
  const showCanvas = eligible && webglOk && inView;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current;
        if (!root) return;
        const caps = captionRefs.current.filter(Boolean) as HTMLDivElement[];

        // Pin the stage; scroll progress drives the camera flight + caption windows.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=320%",
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progress.current = self.progress;
            },
          },
        });
        // Cross-fade captions across the flight (each owns a slice of progress).
        caps.forEach((cap, i) => {
          const slice = 1 / caps.length;
          const start = i * slice;
          gsap.set(cap, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 16 });
          tl.to(cap, { autoAlpha: 1, y: 0, duration: slice * 0.4, ease: "power2.out" }, start + 0.001)
            .to(cap, { autoAlpha: 0, y: -16, duration: slice * 0.35, ease: "power2.in" }, start + slice * 0.62);
        });

        const r = requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => cancelAnimationFrame(r);
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-base">
      {/* WebGL flight (desktop + motion). Static iridescent gradient otherwise. */}
      <div aria-hidden className="absolute inset-0 -z-0">
        {showCanvas ? (
          <div className="size-full animate-[rise-in_1s_ease-out_both]">
            <TrainingRunCanvas progress={progress} />
          </div>
        ) : (
          <div className="hero-fallback size-full" />
        )}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-center px-6 py-24">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {heading}
        </h2>

        {/* Desktop: stacked, cross-fading captions (one shows at a time, driven by
            the flight). Mobile / reduced motion / no-JS: they stack and all show. */}
        <div className="relative mt-12 md:h-44">
          {epochs.map((epoch, i) => (
            <div
              key={epoch.tag}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className="mb-8 max-w-md md:absolute md:inset-x-0 md:top-0 md:mb-0"
            >
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">{epoch.tag}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink md:text-3xl">{epoch.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-dim">{epoch.body}</p>
            </div>
          ))}
        </div>

        {/* Progress rail (desktop pinned only). */}
        <div aria-hidden className="mt-10 hidden h-px w-full max-w-md bg-line motion-safe:md:block">
          <ProgressRail progress={progress} active={showCanvas} />
        </div>
      </div>
    </section>
  );
}

/** Thin rail that reads the same flight progress ref each frame (compositor scaleX). */
function ProgressRail({ progress, active }: { progress: React.RefObject<number>; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!active) return;
      const el = ref.current;
      if (!el) return;
      const tick = () => {
        el.style.transform = `scaleX(${progress.current})`;
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { dependencies: [active] },
  );
  return <div ref={ref} className="h-full origin-left scale-x-0 bg-accent-solid" style={{ willChange: "transform" }} />;
}
