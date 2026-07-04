"use client";

import { useRef } from "react";
import { gsap, useGSAP, useExtraPlugins } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const CHARS = "01<>-_/[]=+";

/**
 * Heading that decodes from random glyphs into its text on scroll-in — the
 * "site compiles itself" loud-type signature (plan.md S10). On-brand for an
 * AI/ML engineer: text resolving from noise like inference settling.
 *
 * a11y + LCP safe: the real text ships server-rendered as an sr-only span (the
 * accessible name + the no-JS / LCP element), with a separate aria-hidden visual
 * span that the lazy ScrambleText plugin resolves. Desktop fine-pointer +
 * motion-safe only — on mobile the h1 IS the LCP element, and a late scramble
 * settle would push LCP out by seconds. Reduced motion / no-JS keep the static
 * text (and a screen reader always reads the real sr-only copy, never the glyphs).
 *
 * CLS 0: scramble glyphs are narrower than the real text, so mid-animation the
 * heading can rewrap and shift everything below it. An invisible copy of the
 * final text sits in the same grid cell and pins the box; the scrambling layer
 * paints over it without ever owning layout.
 */
export function ScrambleHeading({
  text,
  as: Tag = "h2",
  className,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const ready = useExtraPlugins();
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !ready) return;
      const fine =
        window.matchMedia("(pointer: fine)").matches &&
        window.matchMedia("(hover: hover)").matches;
      if (!fine || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.to(el, {
        duration: 1.1,
        ease: "none",
        scrambleText: { text, chars: CHARS, speed: 0.8, revealDelay: 0.15 },
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    },
    { scope: ref, dependencies: [ready] },
  );

  return (
    <Tag className={cn("grid", className)}>
      <span className="sr-only">{text}</span>
      {/* Invisible sizer — the real text reserves the final box (CLS 0). */}
      <span aria-hidden className="invisible col-start-1 row-start-1 select-none">
        {text}
      </span>
      <span ref={ref} aria-hidden className="col-start-1 row-start-1">
        {text}
      </span>
    </Tag>
  );
}
