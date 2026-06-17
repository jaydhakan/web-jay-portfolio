"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Scrubbed "set-piece" reveal (V3 P12) — the children scale up from slightly
 * small + dim and settle as the block scrolls through the viewport, scrubbed to
 * scroll so it reads as a deliberate cinematic beat (used for the oversized
 * case-study results). Transform/opacity only. Desktop + motion only; reduced
 * motion / mobile / no-JS render the children at rest (full size, full opacity).
 */
export function ScrubReveal({
  children,
  className,
  as = "div",
  from = 0.86,
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  /** Starting scale (settles to 1). */
  from?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { scale: from, autoAlpha: 0.35 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              end: "top 45%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: ref, dependencies: [from] },
  );

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} style={{ transformOrigin: "left center" }}>
      {children}
    </Tag>
  );
}
