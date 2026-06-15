"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, input, select, textarea, [data-cursor="hover"]';

type CursorState = "default" | "hover" | "view";

const RING_SCALE: Record<CursorState, number> = { default: 0.5, hover: 0.72, view: 1 };

function subscribe(cb: () => void) {
  const queries = [
    window.matchMedia("(pointer: fine)"),
    window.matchMedia("(hover: hover)"),
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  ];
  for (const q of queries) q.addEventListener("change", cb);
  return () => {
    for (const q of queries) q.removeEventListener("change", cb);
  };
}
function getActive() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Custom cursor (catalog #22): an instant dot + a lagging ring (gsap.quickTo),
 * expanding over interactive elements and growing into a "VIEW" badge over
 * project rows/cards ([data-cursor="view"]). mix-blend-difference so it inverts
 * over any layer; z-60 per the scale. Rendered only for fine pointers with
 * motion allowed (useSyncExternalStore, reactive if a mouse is plugged in); the
 * native cursor is hidden only while it's mounted (html.has-custom-cursor).
 */
export function CustomCursor() {
  const active = useSyncExternalStore(subscribe, getActive, () => false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-custom-cursor");
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-cursor="view"]')) setState("view");
      else if (target?.closest(INTERACTIVE_SELECTOR)) setState("hover");
      else setState("default");
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [active]);

  // Animate the ring scale / dot + label opacity on state change.
  useGSAP(
    () => {
      if (!active) return;
      gsap.to(ringRef.current, { scale: RING_SCALE[state], duration: 0.3, ease: "power3.out" });
      gsap.to(dotRef.current, { opacity: state === "default" ? 1 : 0, duration: 0.2 });
      gsap.to(labelRef.current, {
        opacity: state === "view" ? 1 : 0,
        duration: 0.2,
      });
    },
    { dependencies: [state, active] },
  );

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-difference transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={dotRef}
        className="absolute -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white"
      />
      <div
        ref={ringRef}
        className="absolute -ml-8 -mt-8 flex size-16 items-center justify-center rounded-full border border-white"
      >
        <span
          ref={labelRef}
          className="text-[11px] font-medium uppercase tracking-wider text-white opacity-0"
        >
          View
        </span>
      </div>
    </div>
  );
}
