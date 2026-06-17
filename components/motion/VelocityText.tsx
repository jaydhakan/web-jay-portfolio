"use client";

import { useRef } from "react";
import { useVelocityFrame } from "@/lib/velocity-bus";

const MAX_SKEW = 4; // deg — a subtle "lean", never janky

/**
 * Wraps content so it leans with scroll velocity (skewY) and settles at rest —
 * the velocity bus made visible on headings (plan.md S2, "the whole page moves
 * like one momentum system"). Compositor-only (transform on a block wrapper, so
 * it composes over an inner RevealText line-rise without fighting it), and off
 * under reduced motion (the bus never publishes then). transform-origin left so
 * left-aligned headings pivot naturally.
 */
export function VelocityText({
  children,
  className,
  max = MAX_SKEW,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useVelocityFrame((s) => {
    const el = ref.current;
    if (!el) return;
    const sk = Math.max(-max, Math.min(max, s.velocity * 0.22));
    el.style.transform = `skewY(${sk}deg)`;
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{ transformOrigin: "left center", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
