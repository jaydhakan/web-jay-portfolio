"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, input, select, textarea, [data-cursor="hover"]';

type CursorState = "default" | "hover" | "view";
const RING_SCALE: Record<CursorState, number> = { default: 0.5, hover: 0.78, view: 1 };

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
 * Custom cursor (V3 P4 / S3) — a liquid, morphing cursor. An instant dot, a
 * lagging ring that STRETCHES along its velocity (the gooey/liquid signature)
 * and settles to a circle at rest, a soft trailing blob, and a contextual label
 * ("VIEW" over project rows/cards, or any element's [data-cursor-label]). The
 * ring is MAGNETIC: over a button/link it eases toward the element's center so
 * the cursor "sticks". mix-blend-difference (inverts over any layer), z-60.
 *
 * One gsap.ticker loop drives everything (frame-synced, removable). Rendered
 * only for fine pointers with motion allowed; the native cursor is hidden only
 * while mounted (html.has-custom-cursor). Touch / reduced motion: returns null.
 */
export function CustomCursor() {
  const active = useSyncExternalStore(subscribe, getActive, () => false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [label, setLabel] = useState("View");
  const [visible, setVisible] = useState(false);

  // Latest state for the ticker loop (avoids re-subscribing the loop on change).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const shape = shapeRef.current;
    const trail = trailRef.current;
    if (!dot || !ring || !shape || !trail) return;

    document.documentElement.classList.add("has-custom-cursor");

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pointer };
    const prevRing = { ...pointer };
    const dotPos = { ...pointer };
    const trailPos = { ...pointer };
    let scaleCur = RING_SCALE.default;
    let hovered: Element | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const view = target?.closest('[data-cursor="view"]') ?? null;
      const interactive = target?.closest(INTERACTIVE_SELECTOR) ?? null;
      if (view) {
        setState("view");
        hovered = null; // large targets: follow the pointer, don't stick
      } else if (interactive) {
        setState("hover");
        hovered = interactive;
        const custom = (interactive as HTMLElement).dataset.cursorLabel;
        setLabel(custom ?? "View");
      } else {
        setState("default");
        hovered = null;
      }
    };
    const onLeave = () => setVisible(false);

    const frame = () => {
      // Magnetic pull toward a hovered button/link's center (the "stick").
      let tx = pointer.x;
      let ty = pointer.y;
      if (hovered) {
        const r = hovered.getBoundingClientRect();
        tx = pointer.x + (r.left + r.width / 2 - pointer.x) * 0.45;
        ty = pointer.y + (r.top + r.height / 2 - pointer.y) * 0.45;
      }

      ringPos.x += (tx - ringPos.x) * 0.2;
      ringPos.y += (ty - ringPos.y) * 0.2;
      const vx = ringPos.x - prevRing.x;
      const vy = ringPos.y - prevRing.y;
      prevRing.x = ringPos.x;
      prevRing.y = ringPos.y;

      const speed = Math.hypot(vx, vy);
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      // Liquid stretch — strong only in free movement, damped when hovering so
      // the label stays legible.
      const damp = stateRef.current === "default" ? 1 : 0.25;
      const s = Math.min(speed * 0.022, 0.55) * damp;

      scaleCur += (RING_SCALE[stateRef.current] - scaleCur) * 0.18;

      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      shape.style.transform = `rotate(${angle}deg) scaleX(${scaleCur * (1 + s)}) scaleY(${scaleCur * (1 - s * 0.6)})`;

      dotPos.x += (pointer.x - dotPos.x) * 0.5;
      dotPos.y += (pointer.y - dotPos.y) * 0.5;
      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;

      trailPos.x += (ringPos.x - trailPos.x) * 0.1;
      trailPos.y += (ringPos.y - trailPos.y) * 0.1;
      trail.style.transform = `translate3d(${trailPos.x}px, ${trailPos.y}px, 0) scale(${scaleCur})`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    gsap.ticker.add(frame);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(frame);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-difference transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={trailRef}
        className="absolute left-0 top-0 -ml-9 -mt-9 size-[4.5rem] rounded-full border border-white/30"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 -ml-8 -mt-8 size-16"
        style={{ willChange: "transform" }}
      >
        <div
          ref={shapeRef}
          className="flex size-full items-center justify-center rounded-full border border-white"
          style={{ transformOrigin: "center", willChange: "transform" }}
        >
          <span
            ref={labelRef}
            className="text-[11px] font-medium uppercase tracking-wider text-white transition-opacity duration-200"
            style={{ opacity: state === "view" ? 1 : 0 }}
          >
            {label}
          </span>
        </div>
      </div>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white transition-opacity duration-200"
        style={{ opacity: state === "default" ? 1 : 0, willChange: "transform" }}
      />
    </div>
  );
}
