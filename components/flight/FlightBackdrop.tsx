"use client";

import { useCallback, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useArmedAfterIdle, useGovernedCanvas } from "@/lib/webgl-governance";
import type { Beat } from "@/components/timeline/argmax";
import type { SpineProgress } from "@/components/timeline/flight-progress";

const FlightCanvas = dynamic(() => import("./FlightCanvas"), { ssr: false });

/**
 * FlightBackdrop — the governed mount shell for "The Flight" (timelineplan.md §12).
 *
 * Layer stack (bottom → top): always-painted CSS poster nebula → live canvas (rise-in)
 * → flat contrast scrim → left-column guard (the cards live in the LEFT ~55%; the
 * spectacle is staged in the right half) → always-painted vignette. The whole wrapper
 * is fixed, -z-10, aria-hidden, pointer-events-none, md+ only — it can never affect
 * layout (CLS 0), input, or the accessibility tree.
 *
 * Lifecycle: sticky mount (gate-flap remounting is this repo's documented Context-Lost
 * cause) with `running={inView}` pausing the frameloop off-view; `dead` is a one-way
 * session ratchet on webglcontextlost — canvas unmounts, poster + full Spine remain,
 * and the live-latch resets so the head-dot's glow returns (never leave handed-off DOM
 * degraded — the ParticleFinale lesson).
 *
 * Invariant (documented, not runtime-enforced): no ancestor of this component may gain
 * transform/filter/will-change — it would re-parent the fixed containing block. Never
 * wrap the timeline adapters in FadeUp/ClipReveal.
 */
export function FlightBackdrop({
  sectionRef,
  spine,
  beats,
  glyphSet,
  idleArm = false,
  onLiveChange,
}: {
  /** The timeline section's ref — the IO gate watches THIS, not the fixed wrapper
   *  (a fixed inset-0 element always intersects, which would burn GPU all-route). */
  sectionRef: RefObject<HTMLDivElement | null>;
  spine: RefObject<SpineProgress>;
  beats: Beat[];
  /** Beacon glyphs: /about resolves the cards' lucide icons; /work resolves numerals. */
  glyphSet: "icons" | "numerals";
  /** /work only: its timeline sits near the fold, so additionally wait for idle or
   *  first input before mounting (keeps the chunk out of Lighthouse's TBT window). */
  idleArm?: boolean;
  /** Adapter mirrors this into data-flight-live (head-dot glow handoff). */
  onLiveChange?: (live: boolean) => void;
}) {
  const { show, inView } = useGovernedCanvas<HTMLDivElement>({
    ref: sectionRef,
    profile: "desktop-motion",
    rootMargin: "600px 0px",
    arm: true,
  });
  const idleReady = useArmedAfterIdle(idleArm);
  const gate = show && (!idleArm || idleReady);

  // Sticky mount: once the canvas has existed, keep it (pause via `running` instead).
  const [everShown, setEverShown] = useState(false);
  if (gate && !everShown) setEverShown(true);

  // One-way death latch: context lost → unmount the canvas subtree for the session.
  const [dead, setDead] = useState(false);
  const handleDead = useCallback(() => {
    setDead(true);
    onLiveChange?.(false);
  }, [onLiveChange]);
  const handleLive = useCallback(() => onLiveChange?.(true), [onLiveChange]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
      {/* L0 — poster: static nebula, ALWAYS painted on md+ (SSR / RM-desktop /
          pre-arm / post-context-loss). ≤8% alpha — it can never cost contrast. */}
      <div className="flight-fallback absolute inset-0" />

      {everShown && !dead && (
        <>
          {/* L1 — the live canvas (opacity-only fade: CLS-safe) */}
          <div className="absolute inset-0 animate-[rise-in_1.2s_ease-out_both]">
            <FlightCanvas
              beats={beats}
              spine={spine}
              glyphSet={glyphSet}
              running={inView}
              onLive={handleLive}
              onDead={handleDead}
            />
          </div>
          {/* L2 — flat contrast scrim over the LIVE canvas only */}
          <div className="absolute inset-0 bg-base/25" />
          {/* L3 — left-column guard: extra darkening under the card column */}
          <div className="absolute inset-0 [background:linear-gradient(90deg,oklch(14.5%_0.012_278/0.40)_0%,oklch(14.5%_0.012_278/0.28)_50%,transparent_72%)]" />
        </>
      )}

      {/* L4 — vignette, always painted (poster AND live) — DescentArena formula. */}
      <div className="absolute inset-0 [background:radial-gradient(135%_115%_at_50%_36%,transparent_50%,oklch(14.5%_0.012_278/0.55)_100%),linear-gradient(to_bottom,oklch(14.5%_0.012_278/0.45)_0%,transparent_14%,transparent_82%,oklch(14.5%_0.012_278/0.5)_100%)]" />
    </div>
  );
}
