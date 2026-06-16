"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";

/**
 * Enter-only page transition (catalog #34, D-8). app/template.tsx remounts this
 * on every client navigation — that remount is the wipe trigger. A --base
 * curtain panel retracts via a clip-path inset wipe (reveals the new page
 * top-first) while a welded accent hairline rides the leading edge down the
 * viewport: the drawn-line echo of "The Field". jdFlow (the licensed signature
 * page-wipe ease) at DUR.std (0.8s).
 *
 * STRUCTURE (load-bearing): this lives INSIDE {children} (template.tsx), so it
 * is a SIBLING of the z-60 mix-blend-difference CustomCursor, never an ancestor.
 * The cursor keeps inverting over the z-55 curtain. The curtain carries NO
 * mix-blend-mode / NO isolation / NO opacity<1 at rest, so it never creates a
 * blend-isolating context (plan §4.6).
 *
 * RM / no-JS: the curtain markup is ALWAYS rendered (same DOM on server and
 * client — never branched on reduced motion, which would cause a hydration
 * mismatch). It ships visibility:hidden; only the motion-allowed branch ever
 * makes it visible and animates it. Under reduced motion it stays hidden and the
 * route-reset (scroll-top + ScrollTrigger.refresh + focus #main-content) runs
 * instantly. The wipe is gated by gsap.matchMedia, so RM is decided by the live
 * media query, not by markup.
 *
 * FIRST PAINT IS NEVER WIPED (prevPath === null): the curtain is hidden so the
 * LCP element is never covered on cold load (protects the 95+ gate, R9). It
 * animates only on subsequent in-app navigations.
 */

// Module scope: survives template.tsx remounts, resets on a hard reload — so the
// first paint of a session is detected (prevPath === null) and left un-wiped.
let prevPath: string | null = null;

export function PageTransition() {
  const lenis = useLenisInstance();
  const pathname = usePathname();

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Route-reset contract (plan §6.4): reset scroll to top via the active
      // authority, refresh ScrollTrigger after a double rAF so the revealed
      // layout is measured, then move focus to <main> for keyboard/SR parity.
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

      // The wipe plays only when motion is allowed; the matchMedia callback runs
      // synchronously when it matches, so `played` is reliable right after add().
      let played = false;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        played = true;
        gsap.set(wrap, { autoAlpha: 1 });
        gsap.set(panelRef.current, {
          clipPath: "inset(0% 0% 0% 0%)",
          willChange: "clip-path",
        });
        gsap.set(edgeRef.current, { y: 0, willChange: "transform" });

        gsap
          .timeline({
            defaults: { duration: 0.8, ease: "jdFlow" }, // DUR.std, signature wipe
            onComplete: () => {
              settle();
              gsap.set(wrap, { autoAlpha: 0 });
              gsap.set([panelRef.current, edgeRef.current], {
                willChange: "auto",
              });
            },
          })
          // Panel recedes top-first; the welded accent edge rides the boundary
          // down the viewport in lockstep (same ease/duration, position 0).
          .to(panelRef.current, { clipPath: "inset(100% 0% 0% 0%)" }, 0)
          .to(edgeRef.current, { y: () => window.innerHeight }, 0);
      });

      // Reduced motion (no wipe): instant route swap + reset + focus.
      if (!played) settle();

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
      <div ref={panelRef} className="absolute inset-0 bg-base" />
      <div
        ref={edgeRef}
        className="absolute inset-x-0 top-0 h-[1.5px] bg-accent"
        style={{ boxShadow: "0 0 24px -6px oklch(63% 0.21 272 / 0.35)" }}
      />
    </div>
  );
}
