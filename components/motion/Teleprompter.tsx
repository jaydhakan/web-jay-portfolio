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
          type: "words",
          aria: "auto",
          autoSplit: true,
          onSplit(self) {
            gsap.set(self.words, { opacity: 0.16 });
            return gsap.to(self.words, {
              opacity: 1,
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

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
