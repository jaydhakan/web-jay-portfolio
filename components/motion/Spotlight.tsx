"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
  /** Glow radius in px. */
  radius?: number;
  /** Peak accent opacity (0-1). */
  intensity?: number;
};

/**
 * Mouse-tracked spotlight (catalog #24, the ambient variant): a soft accent
 * glow follows the cursor across the wrapped content and fades out on leave.
 * Cursor position + visibility live in CSS vars (no React state for the
 * continuous value). Desktop + fine pointer + motion-allowed only; everywhere
 * else the glow simply never turns on, so content is unaffected.
 */
export function Spotlight({ children, className, radius = 340, intensity = 0.1 }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!mq.matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
        el.style.setProperty("--so", "1");
      });
    };
    const onLeave = () => el.style.setProperty("--so", "0");

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={{ "--sx": "50%", "--sy": "50%", "--so": "0" } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--so)" as unknown as number,
          background: `radial-gradient(${radius}px circle at var(--sx) var(--sy), oklch(63% 0.21 272 / ${intensity}), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
