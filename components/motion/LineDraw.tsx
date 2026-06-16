"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR, useExtraPlugins } from "@/lib/gsap";

type LineDrawProps = {
  /** SVG children — paths/lines to draw. Each drawn element needs data-draw. */
  children: React.ReactNode;
  className?: string;
  /** viewBox of the inline svg, e.g. "0 0 100 2". */
  viewBox: string;
  /** Scrub to scroll (timeline draws as you scroll) vs play once on entry. */
  scrub?: boolean;
  /** ScrollTrigger start. Defaults to "top 85%". */
  start?: string;
  ariaLabel?: string;
};

/**
 * SVG stroke draw-on-scroll (catalog #9, plan §4.5) — the drawn-line echo of
 * "The Field" signature. Mark each stroke to animate with data-draw; it starts
 * undrawn (DrawSVG "0%") at runtime and draws to full as the element enters.
 *
 * Runtime-set start state (R7): without JS / under reduced motion the SVG is
 * fully drawn and static. aria-hidden by default (decorative); pass ariaLabel
 * to expose meaning.
 */
export function LineDraw({
  children,
  className,
  viewBox,
  scrub = false,
  start = "top 85%",
  ariaLabel,
}: LineDrawProps) {
  const ref = useRef<SVGSVGElement>(null);
  const ready = useExtraPlugins(); // DrawSVG loads lazily after mount

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const strokes = ref.current?.querySelectorAll("[data-draw]");
        if (!strokes || strokes.length === 0) return;

        gsap.set(strokes, { drawSVG: "0%" });
        gsap.to(strokes, {
          drawSVG: "100%",
          duration: scrub ? undefined : DUR.hero,
          ease: scrub ? "none" : "jdFlow",
          stagger: 0.1,
          scrollTrigger: scrub
            ? {
                trigger: ref.current,
                start: "top 80%",
                end: "bottom 60%",
                scrub: true,
                invalidateOnRefresh: true,
              }
            : { trigger: ref.current, start, once: true },
        });
      });
    },
    { scope: ref, dependencies: [ready, scrub, start] },
  );

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      fill="none"
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {children}
    </svg>
  );
}
