"use client";

import { useEffect } from "react";

/**
 * Kinetic-weight enhancer for the hero H1 (new_plan Big Swing 2). The H1 ships
 * server-rendered at rest weight (the LCP element, opacity:1) inside Hero.tsx;
 * this *enhances* it after paint and never owns the markup, so no-JS / reduced
 * motion / mobile keep the plain, fully-legible headline.
 *
 * Desktop fine-pointer + motion-safe only. It splits the already-painted
 * `[data-hero-line]` text into per-letter spans (same move GSAP SplitText makes),
 * runs a one-shot weight-settle on load (bold -> rest, left to right), then drives
 * each letter's Syne `wght` axis by its distance to the cursor — a bold wave that
 * follows the pointer and eases back.
 *
 * Two correctness details:
 *  - Letters are grouped into per-word `whitespace-nowrap` wrappers so words stay
 *    atomic (bare inline-blocks would break mid-word).
 *  - Each letter is PINNED to its rest width, so the weight wave thickens glyphs
 *    in place and never reflows the line — a wrapped row would be clipped by the
 *    H1's masked `overflow-hidden`. Widths are re-pinned on resize (the size is a
 *    vw clamp) and measured after the variable font loads.
 *
 * The lines stay block-level, so the opening choreo's masked-line rise (a transform
 * on the same `[data-hero-line]`) composes untouched. Renders nothing.
 */
const REST = 700; // matches the H1's CSS font-bold, so the JS handoff is seamless
const PEAK = 830;
const SIGMA = 90; // px falloff radius of the cursor wave

export function HeroHeadlineKinetic() {
  useEffect(() => {
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches;
    const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || !motionOK) return; // mobile / reduced motion keep the static H1

    const lines = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-line]"));
    if (!lines.length) return;

    let cancelled = false;
    let raf = 0;
    let repinRAF = 0;
    let pendingX = -1;
    let centers: number[] = [];
    const letters: HTMLElement[] = [];

    // Pin each letter to its natural rest-weight width (re-run on resize since the
    // font size is a vw clamp). Reads force a single reflow; cheap and rare.
    const repin = () => {
      for (const el of letters) {
        el.style.width = "";
        el.style.fontVariationSettings = `"wght" ${REST}`;
      }
      const widths = letters.map((el) => el.getBoundingClientRect().width);
      letters.forEach((el, i) => (el.style.width = `${widths[i]}px`));
      centers = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    };

    const apply = () => {
      raf = 0;
      for (let i = 0; i < letters.length; i++) {
        const d = centers[i] - pendingX;
        const w = Math.round(REST + (PEAK - REST) * Math.exp(-(d * d) / (2 * SIGMA * SIGMA)));
        letters[i].style.fontVariationSettings = `"wght" ${w}`;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pendingX = e.clientX;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      for (const el of letters) el.style.fontVariationSettings = `"wght" ${REST}`;
    };
    const onResize = () => {
      if (!repinRAF) repinRAF = requestAnimationFrame(() => ((repinRAF = 0), repin()));
    };

    let settleRAF = 0;
    let settleClear = 0;

    const build = () => {
      if (cancelled) return;

      // Split each painted line into word-grouped letter spans (rest weight).
      for (const line of lines) {
        const words = (line.textContent ?? "").split(" ");
        line.textContent = "";
        words.forEach((word, wi) => {
          const wordSpan = document.createElement("span");
          wordSpan.className = "inline-block whitespace-nowrap";
          for (const ch of word) {
            const span = document.createElement("span");
            span.className = "inline-block text-center";
            span.style.fontVariationSettings = `"wght" ${REST}`;
            span.textContent = ch;
            wordSpan.appendChild(span);
            letters.push(span);
          }
          line.appendChild(wordSpan);
          if (wi < words.length - 1) line.appendChild(document.createTextNode(" "));
        });
      }

      repin(); // pin rest widths before any weight animation
      for (const el of letters) {
        el.style.transition = "font-variation-settings 360ms cubic-bezier(0.16,1,0.3,1)";
      }

      // One-shot weight-settle on load: bold -> rest, staggered left to right.
      for (const el of letters) el.style.fontVariationSettings = `"wght" ${PEAK}`;
      settleRAF = requestAnimationFrame(() => {
        letters.forEach((el, i) => {
          el.style.transitionDelay = `${i * 16}ms`;
          el.style.fontVariationSettings = `"wght" ${REST}`;
        });
      });
      settleClear = window.setTimeout(
        () => letters.forEach((el) => (el.style.transitionDelay = "0ms")),
        letters.length * 16 + 500,
      );

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeave, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
    };

    // Measure after the variable font is ready (widths must be Syne's, not the
    // fallback) so the pinning is correct.
    if (document.fonts?.ready) void document.fonts.ready.then(build);
    else build();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(repinRAF);
      cancelAnimationFrame(settleRAF);
      window.clearTimeout(settleClear);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
