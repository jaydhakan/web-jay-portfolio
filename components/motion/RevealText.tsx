"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR, useExtraPlugins, getSplitText } from "@/lib/gsap";

type RevealTextProps = {
  children: React.ReactNode;
  className?: string;
  /** Heading/paragraph element. Defaults to a p; pass "h1".."h3" for headings. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Split granularity. "lines" (default) is the staple; "words" for shorter copy. */
  type?: "lines" | "words";
  /** Stagger between split units, seconds. */
  stagger?: number;
  /** ScrollTrigger start. Defaults to "top 80%". */
  start?: string;
};

/**
 * The signature reveal language (catalog #1, plan §6.3): lines rise from behind
 * overflow-hidden masks as the element enters view. Built on SplitText with
 * autoSplit so it re-splits correctly on font-load and resize — tweens are
 * created INSIDE onSplit (the only safe place; revert is automatic). aria:"auto"
 * keeps the original text exposed to assistive tech.
 *
 * The text ships fully visible (opacity:1); GSAP sets the hidden start state at
 * runtime, so no-JS and reduced-motion users get static, readable copy (R7).
 */
export function RevealText({
  children,
  className,
  as = "p",
  type = "lines",
  stagger = 0.08,
  start = "top 80%",
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;
  const ready = useExtraPlugins(); // SplitText loads lazily after mount

  useGSAP(
    () => {
      const SplitText = getSplitText();
      if (!ready || !SplitText) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(ref.current, {
          type,
          mask: type,
          aria: "auto",
          autoSplit: true,
          onSplit(self) {
            const targets = type === "lines" ? self.lines : self.words;
            return gsap.from(targets, {
              yPercent: 110,
              duration: DUR.std,
              stagger,
              ease: "expo.out",
              scrollTrigger: { trigger: ref.current, start, once: true },
            });
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref, dependencies: [ready, type, stagger, start] },
  );

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
