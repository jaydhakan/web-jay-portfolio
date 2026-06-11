"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * Reading-progress hairline at the very top of the viewport.
 * Scroll-linked state indication (1:1 with position), so it stays on under
 * reduced motion, just without spring smoothing.
 */
export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[45] h-0.5 origin-left bg-accent-primary"
      style={{ scaleX: reduceMotion ? scrollYProgress : smoothed }}
    />
  );
}
