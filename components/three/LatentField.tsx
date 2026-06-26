"use client";

import dynamic from "next/dynamic";
import { useGovernedCanvas } from "@/lib/webgl-governance";
import type { FieldLayout } from "./LatentFieldCanvas";

const LatentFieldCanvas = dynamic(() => import("./LatentFieldCanvas"), { ssr: false });

/**
 * Page-wide mount gate for the LatentField (V3 Phase 2 / E1). Renders ONE governed
 * particle canvas FIXED behind the whole route (top-to-bottom), morphing from a
 * curl-noise flow field at the top into latent clusters by the footer as you scroll.
 *
 * The static iridescent poster (`.hero-fallback`) is always painted: it is the SSR /
 * first-paint / reduced-motion / mobile / no-WebGL layer, so the page never waits on
 * WebGL and mobile stays functional (designed, not blank). The canvas (desktop +
 * motion + WebGL + armed-after-paint only) fades in over it. `aria-hidden` +
 * `pointer-events-none`: pure decoration over an authoritative DOM page; the cursor
 * still perturbs it via a window listener inside the canvas.
 *
 * The body background propagates to the canvas, so this `-z-10` layer paints above
 * the base color and beneath all content — visible through every transparent section.
 * Each route mounts at most one (the cardinal one-canvas rule).
 */
export function LatentField({
  count,
  clusterCount,
  layout,
}: {
  count?: number;
  clusterCount?: number;
  /** Cluster arrangement — the per-page "scene" (Home scatter, About radial). */
  layout?: FieldLayout;
}) {
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
            <LatentFieldCanvas count={count} clusterCount={clusterCount} layout={layout} />
          </div>
          {/* Contrast guard: a thin base scrim over the LIVE field so additive glow
              never drops body copy below AAA (DOM/text stays authoritative). Dims
              brightness only — the motion (the "wow") is untouched. */}
          <div className="absolute inset-0 bg-base/25" />
        </>
      )}
      {/* Cinematic vignette + depth — ALWAYS painted (over the poster AND the live
          field), so the backdrop reads as layered deep space seated behind the
          content rather than a flat sheet of stars. Darkens the edges + the very
          top (under the header) and bottom (toward the footer) so text-heavy bands
          stay calm and readable. Static CSS gradients only — zero paint/JS cost. */}
      <div
        className="absolute inset-0 [background:radial-gradient(135%_115%_at_50%_36%,transparent_50%,oklch(14.5%_0.012_278/0.55)_100%),linear-gradient(to_bottom,oklch(14.5%_0.012_278/0.45)_0%,transparent_14%,transparent_82%,oklch(14.5%_0.012_278/0.5)_100%)]"
      />
    </div>
  );
}
