import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion variants. Use with the shared `transition` below.
 * Components must gate motion behind useReducedMotion() — when reduced,
 * render the `visible` state directly (initial={false}) instead of animating.
 */

// Shared transition — custom cubic bezier, used on every variant.
export const transition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition },
};

/** Default viewport config for whileInView reveals — fire once, ~30% visible. */
export const viewportOnce = { once: true, amount: 0.3 } as const;
