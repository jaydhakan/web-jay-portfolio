"use client";

import { useRef } from "react";
import { gsap, useGSAP, useExtraPlugins, getSplitText } from "@/lib/gsap";

type TeleprompterProps = {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "div" | "blockquote";
};

/**
 * Scroll-lit word reveal (catalog #2). Words start dim and light up in sequence
 * tied to scroll progress (scrubbed), resolving to full ink by the time the
 * statement is read — a teleprompter for the about statement. Built on SplitText
 * (words, aria:auto so the text stays exposed). Runtime-set dim state under
 * no-preference only; reduced motion / no-JS keep it fully lit and readable (R7).
 */
export function Teleprompter({ children, className, as = "p" }: TeleprompterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const Tag = as;
  const ready = useExtraPlugins(); // SplitText loads lazily after mount

  useGSAP(
    () => {
      const SplitText = getSplitText();
      if (!ready || !SplitText) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // aria:"none" — the animated span is already aria-hidden and the readable
        // copy lives in the sr-only span, so SplitText must NOT add an aria-label
        // (prohibited on <p>) and the dimmed words are out of the a11y/contrast
        // tree entirely.
        const split = SplitText.create(ref.current, {
          type: "words",
          aria: "none",
          autoSplit: true,
          onSplit(self) {
            // Light words from --ink-dim (#a3a4c4, ~8:1 — readable) up to --ink,
            // not from near-zero opacity: a sub-contrast dim state fails the a11y
            // audit even on aria-hidden text. Hex twins (GSAP can't tween oklch).
            gsap.set(self.words, { color: "#a3a4c4" });
            return gsap.to(self.words, {
              color: "#ebecfa",
              ease: "none",
              stagger: 0.08,
              scrollTrigger: {
                trigger: ref.current,
                start: "top 78%",
                end: "bottom 62%",
                scrub: true,
              },
            });
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref, dependencies: [ready] },
  );

  // Accessible copy is the sr-only span (read once, full contrast); the visible
  // teleprompter is aria-hidden so the scroll-lit dim state never trips contrast
  // or duplicates for screen readers. No-JS / reduced motion: the aria-hidden
  // span renders fully lit and static (R7).
  return (
    <Tag className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden ref={ref}>
        {children}
      </span>
    </Tag>
  );
}
