"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Seconds. */
  duration?: number;
  className?: string;
};

/**
 * Counts from 0 to `value` when scrolled into view. Server-renders the final
 * value (correct without JS, correct for SEO); the animation mutates
 * textContent directly so no React re-renders happen per frame.
 * Reduced motion: final value stays as-is.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.4,
  className,
}: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    const el = ref.current;
    if (!inView || reduceMotion || !el) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, duration, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {`${prefix}${value.toFixed(decimals)}${suffix}`}
    </span>
  );
}
