"use client";

import { useEffect, useRef } from "react";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";

/**
 * Reading-progress hairline at the very top of the viewport (catalog #8).
 * Scroll-linked 1:1 with position, so it stays on under reduced motion (just
 * sourced from native scroll instead of Lenis). scaleX is written straight to
 * the DOM in the scroll callback — never React state — so a continuous value
 * doesn't re-render the tree (spec R10).
 */
export function ScrollProgress() {
  const lenis = useLenisInstance();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const set = (progress: number) => {
      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    };

    if (lenis) {
      const handler = ({ progress }: { progress: number }) => set(progress);
      lenis.on("scroll", handler);
      set(lenis.progress ?? 0);
      return () => lenis.off("scroll", handler);
    }

    const handler = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      set(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    handler();
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [lenis]);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[45] h-0.5 origin-left bg-accent"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
