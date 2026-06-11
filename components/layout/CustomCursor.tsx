"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, input, select, textarea, [data-cursor="hover"]';

/**
 * 8px dot that trails the pointer; expands to a 40px mix-blend-difference
 * ring over interactive elements (DESIGN.md signature). Renders nothing for
 * touch pointers and under reduced motion; the native cursor is hidden only
 * while this is active (html.has-custom-cursor).
 */
export function CustomCursor() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // High stiffness = the "slight lag" from the spec, not a floaty trail.
  const springX = useSpring(x, { stiffness: 700, damping: 50, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 700, damping: 50, mass: 0.5 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(finePointer.matches && !reduceMotion);
    update();
    finePointer.addEventListener("change", update);
    return () => finePointer.removeEventListener("change", update);
  }, [reduceMotion]);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest(INTERACTIVE_SELECTOR)));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeaveWindow = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  // Base box is 40px; the dot state scales it to 8px (0.2).
  const scale = hovering ? (pressed ? 0.8 : 1) : pressed ? 0.14 : 0.2;

  return (
    // Centered on the pointer via negative margins: motion's x/y own the
    // transform, so translate utilities would be overwritten.
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] -ml-5 -mt-5 size-10 mix-blend-difference"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        className="size-full rounded-full border-[1.5px] border-white"
        animate={{
          scale,
          backgroundColor: hovering ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
    </motion.div>
  );
}
