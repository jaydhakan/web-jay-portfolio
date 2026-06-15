"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR } from "@/lib/gsap";

type ClipRevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  /** Stagger between direct children, seconds. 0 wipes the element itself. */
  stagger?: number;
  /** ScrollTrigger start. Defaults to "top 82%". */
  start?: string;
};

/**
 * Clip-path wipe reveal (catalog #15) — the block half of the site's reveal
 * grammar ("content emerges from behind an edge"): elements wipe in left to
 * right via clip-path inset, on the signature jdFlow ease. Runtime-set start
 * state (R7): markup ships unclipped/visible, GSAP applies the inset only under
 * no-preference, so no-JS and reduced-motion users see everything.
 */
export function ClipReveal({
  children,
  className,
  as = "div",
  stagger = 0.12,
  start = "top 82%",
}: ClipRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger > 0 ? (ref.current?.children ?? null) : ref.current;
        if (!targets || (targets instanceof HTMLCollection && targets.length === 0)) return;

        gsap.fromTo(
          targets as gsap.TweenTarget,
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: DUR.std,
            ease: "jdFlow",
            stagger: stagger > 0 ? stagger : undefined,
            scrollTrigger: { trigger: ref.current, start, once: true },
          },
        );
      });
    },
    { scope: ref, dependencies: [stagger, start] },
  );

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
