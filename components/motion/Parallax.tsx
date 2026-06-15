"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  /**
   * Drift strength. Positive = element trails the scroll (moves up slower);
   * the value is the total vertical travel in px across the trigger range.
   * Keep subtle (≤ ~80) — "never dramatic" (catalog #14).
   */
  speed?: number;
};

/**
 * Subtle layered-depth parallax (catalog #14): the element translates a little
 * slower than the page as it passes through the viewport, scrubbed to scroll.
 * Transform-only. Desktop + motion-allowed only — disabled on touch/small
 * screens and reduced motion, where it renders as a normal static element.
 */
export function Parallax({ children, className, as = "div", speed = 60 }: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Pointer-fine + wide viewport only; mobile gets no parallax (R4).
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { y: speed / 2 },
          {
            y: -speed / 2,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: ref, dependencies: [speed] },
  );

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
