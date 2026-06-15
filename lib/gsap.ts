"use client";

/**
 * Single GSAP registration point (plan.md §6.1). Import gsap / useGSAP /
 * ScrollTrigger / SplitText / Flip from here — never from "gsap" directly —
 * so plugins are registered exactly once and the jdFlow ease + DUR scale are
 * always available.
 *
 * GSAP 3.13+ ships every former-premium plugin free in the public package
 * (SplitText, ScrollTrigger, Flip, DrawSVG, ScrambleText, CustomEase). No Club
 * membership, no private registry.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";

// registerPlugin is idempotent; guard the CustomEase.create so a Fast-Refresh
// re-import doesn't warn about redefining "jdFlow".
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  Flip,
  DrawSVGPlugin,
  ScrambleTextPlugin,
  CustomEase,
);

if (!CustomEase.get?.("jdFlow")) {
  // Signature ease — reserved for the wipe/panel/line-draw family only.
  CustomEase.create("jdFlow", "M0,0 C0.7,0 0.18,1 1,1");
}

/** The only three durations on the site (spec §4.3). */
export const DUR = { micro: 0.4, std: 0.8, hero: 1.2 } as const;

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };
