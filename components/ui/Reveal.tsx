"use client";

import { motion, useReducedMotion } from "motion/react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";

/**
 * In-view reveal wrappers (below-fold sections only; the hero uses CSS).
 * Every animated element carries data-reveal so the layout-level <noscript>
 * style forces it visible when JS is off. Reduced motion renders plain divs.
 */

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      data-reveal
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}

/** Parent for staggered grids/lists; children must be RevealItem. */
export function RevealGroup({ children, className }: RevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: RevealProps & { as?: "div" | "li" }) {
  const reduceMotion = useReducedMotion();
  const Tag = as;
  if (reduceMotion) return <Tag className={className}>{children}</Tag>;
  const MotionTag = as === "li" ? motion.li : motion.div;
  return (
    <MotionTag data-reveal className={className} variants={fadeUp}>
      {children}
    </MotionTag>
  );
}
