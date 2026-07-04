"use client";

import dynamic from "next/dynamic";
import { useGovernedCanvas } from "@/lib/webgl-governance";

const DescentArenaCanvas = dynamic(() => import("./DescentArenaCanvas"), { ssr: false });

/**
 * Page-wide mount gate for THE DESCENT ARENA (plan.md) — home's one canvas: a live,
 * playable gradient-descent loss landscape fixed behind the whole route. Optimizer
 * probes are always descending it; the cursor deforms the objective; a click drops a
 * new probe. Past the fold the camera pulls up and the arena dims into quiet contour
 * cartography behind the rest of the page.
 *
 * Same governed contract as the old LatentField mount: the static iridescent poster
 * (`.hero-fallback`) is ALWAYS painted (SSR / first paint / reduced-motion / mobile /
 * no-WebGL); the canvas (desktop + motion + WebGL + armed) fades in over it;
 * `aria-hidden` + `pointer-events-none` (interaction arrives via window listeners —
 * the DOM page stays authoritative); at most one page-wide canvas per route.
 */
export function DescentArena() {
  const { ref, show } = useGovernedCanvas<HTMLDivElement>({
    profile: "desktop-motion",
    arm: true,
  });

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* Static iridescent poster — load / RM / mobile / no-WebGL state. */}
      <div className="hero-fallback absolute inset-0" />
      {show && (
        <>
          <div className="absolute inset-0 animate-[rise-in_1.2s_ease-out_both]">
            <DescentArenaCanvas />
          </div>
          {/* Contrast guard: a thin base scrim over the LIVE arena so emissive glow
              never drops body copy below AAA (DOM/text stays authoritative). */}
          <div className="absolute inset-0 bg-base/25" />
        </>
      )}
      {/* Cinematic vignette + depth — always painted (poster AND live), so the arena
          reads as deep cartography seated behind the content. Static CSS only. */}
      <div
        className="absolute inset-0 [background:radial-gradient(135%_115%_at_50%_36%,transparent_50%,oklch(14.5%_0.012_278/0.55)_100%),linear-gradient(to_bottom,oklch(14.5%_0.012_278/0.45)_0%,transparent_14%,transparent_82%,oklch(14.5%_0.012_278/0.5)_100%)]"
      />
    </div>
  );
}
