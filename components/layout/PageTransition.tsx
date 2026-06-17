"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";

/**
 * Latent-space page transition (V3 P5 / S9, supersedes the D-8 clip wipe).
 * app/template.tsx remounts this on every client navigation — that remount is
 * the trigger. The curtain is a GRID OF TILES that dissolve out in random
 * ("decode") order to reveal the new page, with an iridescent energy flash:
 * navigation reads as morphing through latent space / the site recompiling
 * itself. Compositor-only (per-tile scale + opacity, one flash opacity) — no
 * second WebGL context, no View-Transitions dependency, so it's loud AND robust.
 *
 * STRUCTURE (load-bearing): lives INSIDE {children} (template.tsx) as a SIBLING
 * of the z-60 mix-blend-difference CustomCursor, never an ancestor. The wrap
 * carries NO mix-blend / NO isolation / NO opacity<1 at rest (visibility:hidden,
 * then autoAlpha:1 during the transition), so it never creates a blend-isolating
 * context (plan §4.6) and the cursor keeps inverting over it.
 *
 * RM / no-JS: the markup is ALWAYS rendered identically (no branch on reduced
 * motion -> no hydration mismatch); it ships visibility:hidden. Only the
 * motion-allowed matchMedia branch makes it visible + animates. Under reduced
 * motion the route-reset runs instantly. FIRST PAINT IS NEVER COVERED
 * (prevPath === null) so the LCP element is never hidden on cold load (R9).
 */

const COLS = 10;
const ROWS = 6;
const TILES = Array.from({ length: COLS * ROWS });

// Module scope: survives template.tsx remounts, resets on hard reload — so the
// first paint of a session is detected (prevPath === null) and left uncovered.
let prevPath: string | null = null;

export function PageTransition() {
  const lenis = useLenisInstance();
  const pathname = usePathname();

  const wrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Route-reset contract (plan §6.4): scroll to top via the active authority,
      // refresh ScrollTrigger after a double rAF, then focus <main> for parity.
      const settle = () => {
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => ScrollTrigger.refresh()),
        );
        document.getElementById("main-content")?.focus({ preventScroll: true });
      };

      const isNav = prevPath !== null && prevPath !== pathname;
      prevPath = pathname;
      if (!isNav) return; // first paint / hard reload: leave content uncovered

      let played = false;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        played = true;

        gsap.set(wrap, { autoAlpha: 1 });
        gsap.set(".pt-tile", { scale: 1, autoAlpha: 1, transformOrigin: "center" });
        gsap.set(flashRef.current, { autoAlpha: 0 });

        gsap
          .timeline({
            onComplete: () => {
              settle();
              gsap.set(wrap, { autoAlpha: 0 });
            },
          })
          // Iridescent energy pulse as the curtain breaks apart.
          .to(flashRef.current, { autoAlpha: 0.55, duration: 0.18, ease: "power2.out" }, 0)
          .to(flashRef.current, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0.18)
          // Tiles dissolve out in random order (the "decode") to reveal the page.
          .to(
            ".pt-tile",
            {
              scale: 0,
              autoAlpha: 0,
              duration: 0.5,
              ease: "power2.in",
              stagger: { amount: 0.45, grid: [ROWS, COLS], from: "random" },
            },
            0,
          );
      });

      if (!played) settle(); // reduced motion: instant swap + reset + focus
      return () => mm.revert();
    },
    { dependencies: [pathname], scope: wrapRef },
  );

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55]"
      style={{ visibility: "hidden" }}
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {TILES.map((_, i) => (
          <div
            key={i}
            className="pt-tile bg-base"
            style={{ willChange: "transform, opacity" }}
          />
        ))}
      </div>
      <div
        ref={flashRef}
        className="absolute inset-0"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 80% 70% at 60% 40%, oklch(63% 0.21 272 / 0.5), oklch(66% 0.19 285 / 0.32) 45%, oklch(86% 0.115 207 / 0.14) 70%, transparent 85%)",
        }}
      />
    </div>
  );
}
