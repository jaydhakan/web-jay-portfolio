"use client";

import { useRef } from "react";
import { gsap, useExtraPlugins } from "@/lib/gsap";

/**
 * Scramble-on-hover (new_plan 2.2 / 6.4) — a sitewide echo of the preloader
 * signature. On pointer-enter the glyphs cycle, then resolve left-to-right to
 * `text`, via the lazy ScrambleText plugin (a no-op until it has loaded). The
 * visible copy is aria-hidden, so the enclosing link/element MUST carry the
 * real accessible name (aria-label). Reduced motion: no-op (text stays static).
 */
export function ScrambleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ready = useExtraPlugins();
  const ref = useRef<HTMLSpanElement>(null);

  const onEnter = () => {
    const el = ref.current;
    if (!el || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(el, {
      duration: 0.7,
      ease: "none",
      scrambleText: { text, chars: "01<>-_\\/[]=+", speed: 0.9, revealDelay: 0.08 },
    });
  };

  return (
    <span ref={ref} aria-hidden onMouseEnter={onEnter} className={className}>
      {text}
    </span>
  );
}
