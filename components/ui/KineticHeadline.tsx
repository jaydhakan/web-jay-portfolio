"use client";

import { Fragment, useEffect, useRef } from "react";

/**
 * Kinetic variable-weight headline (new_plan / spec "effect 5") — the #1 2026
 * type trend. Each letter's Syne `wght` axis is driven by its horizontal
 * distance to the cursor: a bold wave follows the pointer and settles back on
 * leave. Desktop + fine-pointer + motion-safe only (font-variation-settings is a
 * paint, so this stays an on-demand micro-moment on one element); touch / reduced
 * motion render a static REST-weight headline. Requires Syne loaded as a variable
 * font. The visual is aria-hidden — the enclosing element carries the real name.
 */
const REST = 500;
const PEAK = 800;
const SIGMA = 64; // px falloff radius around the cursor

export function KineticHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);
  const centers = useRef<number[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const active =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active) return;

    let raf = 0;
    let pendingX = -1;
    const measure = () => {
      centers.current = charRefs.current.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    };
    const apply = () => {
      raf = 0;
      const x = pendingX;
      for (let i = 0; i < charRefs.current.length; i++) {
        const d = centers.current[i] - x;
        const w = Math.round(REST + (PEAK - REST) * Math.exp(-(d * d) / (2 * SIGMA * SIGMA)));
        charRefs.current[i].style.fontVariationSettings = `"wght" ${w}`;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pendingX = e.clientX;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      for (const el of charRefs.current) el.style.fontVariationSettings = `"wght" ${REST}`;
    };

    measure();
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  charRefs.current = [];
  const words = text.split(" ");

  return (
    <span
      ref={rootRef}
      aria-hidden
      className={className}
      style={{ fontVariationSettings: `"wght" ${REST}` }}
    >
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className="inline-block whitespace-nowrap">
            {[...word].map((ch, ci) => (
              <span
                key={ci}
                ref={(el) => {
                  if (el) charRefs.current.push(el);
                }}
                className="inline-block transition-[font-variation-settings] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
