"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Page-enter transition: a short fade-rise on every route change.
 * App Router re-mounts templates per navigation, which retriggers it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
