"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR } from "@/lib/gsap";

type FadeUpProps = {
  children: React.ReactNode;
  className?: string;
  /** Render element. Defaults to a div; pass "li"/"section" etc. for semantics. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Stagger between direct children. 0 (default) animates the element itself. */
  stagger?: number;
  /** Extra delay before the tween, seconds. */
  delay?: number;
  /** ScrollTrigger start. Defaults to "top 85%". */
  start?: string;
};

/**
 * The site's baseline reveal: content rises a few px and fades in as it enters
 * (catalog grammar — "emerges from behind an edge"). Runtime-set initial state
 * (R7): the markup ships visible, GSAP only animates what is already there, so
 * no-JS and reduced-motion users see the final layout with nothing hidden.
 *
 * stagger > 0 animates direct children instead of the wrapper — use for grids
 * and lists. All triggers are scoped + auto-reverted by useGSAP on unmount.
 */
export function FadeUp({
  children,
  className,
  as = "div",
  stagger = 0,
  delay = 0,
  start = "top 85%",
}: FadeUpProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets =
          stagger > 0 ? (ref.current?.children ?? []) : ref.current;
        if (!targets || (targets instanceof HTMLCollection && targets.length === 0)) return;

        gsap.from(targets as gsap.TweenTarget, {
          opacity: 0,
          y: 24,
          duration: DUR.std,
          ease: "expo.out",
          delay,
          stagger: stagger > 0 ? stagger : undefined,
          scrollTrigger: { trigger: ref.current, start, once: true },
        });
      });
    },
    { scope: ref, dependencies: [stagger, delay, start] },
  );

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
