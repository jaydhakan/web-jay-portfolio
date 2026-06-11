"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** Max translation in px when the cursor reaches the element's edge. */
  strength?: number;
};

const springConfig = { stiffness: 200, damping: 18, mass: 0.4 };

/**
 * Magnetic hover wrapper for CTAs. Springs toward the cursor via motion
 * values (no React re-renders), releases with momentum on leave.
 * Inert for touch pointers and under reduced motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 12,
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  if (reduceMotion) {
    return <div className={cn("inline-block", className)}>{children}</div>;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
