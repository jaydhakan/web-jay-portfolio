"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type CounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

/**
 * Kinetic counter (catalog #27, GSAP): ticks 0 → value on scroll entry over
 * 1.2s (honoring the duration scale over the catalog's "~2s"). The final value
 * is server-rendered (correct without JS, correct for SEO); GSAP mutates
 * textContent directly so no React re-render fires per frame (R10). Reduced
 * motion leaves the final value as-is. Use tabular mono numerals — Syne's
 * figures aren't tabular (plan §4.2).
 */
export function Counter({ value, prefix = "", suffix = "", decimals = 0, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const format = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: value,
          duration: DUR.hero,
          ease: "power2.out", // ≈ easeOutQuart feel
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
          onUpdate() {
            if (ref.current) ref.current.textContent = format(obj.v);
          },
        });
      });
    },
    { scope: ref, dependencies: [value, prefix, suffix, decimals] },
  );

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {format(value)}
    </span>
  );
}
