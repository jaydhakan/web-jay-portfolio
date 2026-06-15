"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** Max translation in px when the cursor reaches the element's edge. */
  strength?: number;
};

/**
 * Magnetic hover wrapper for CTAs (catalog #23). The element eases toward the
 * cursor via gsap.quickTo (off the render cycle, expo.out — no bounce, honoring
 * the locked motion vocabulary) and springs back on leave. Hover + fine pointer
 * + motion-allowed only; inert (and untouched) everywhere else.
 */
export function MagneticButton({ children, className, strength = 14 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "expo.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "expo.out" });

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const relX = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const relY = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          xTo(relX * strength);
          yTo(relY * strength);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };

        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("inline-block", className)}>
      {children}
    </div>
  );
}
