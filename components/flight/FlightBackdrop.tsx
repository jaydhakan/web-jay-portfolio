"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useArmedAfterIdle, useGovernedCanvas } from "@/lib/webgl-governance";
import type { Beat } from "@/components/timeline/argmax";
import type { SpineProgress } from "@/components/timeline/flight-progress";

const FlightCanvas = dynamic(() => import("./FlightCanvas"), { ssr: false });

/** Content of one hologram card (holo pivot): the readable form of a beacon. */
export type HoloItem = {
  /** mono eyebrow — "06 · AI & Agents" on /work, "Award · 2024" on /about */
  kicker: string;
  title: string;
  /** one key line — the result metric (/work) or capability tags (/about) */
  line?: string;
};

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
  holo,
  idleArm = false,
  onLiveChange,
}: {
  /** The timeline section's ref — the IO gate watches THIS, not the fixed wrapper
   *  (a fixed inset-0 element always intersects, which would burn GPU all-route). */
  sectionRef: RefObject<HTMLDivElement | null>;
  spine: RefObject<SpineProgress>;
  beats: Beat[];
  /** Hologram card per beacon (index-locked to beats) — see HoloItem. */
  holo: HoloItem[];
  /** /work only: its timeline sits near the fold, so additionally wait for idle or
   *  first input before mounting (keeps the chunk out of Lighthouse's TBT window). */
  idleArm?: boolean;
  /** Adapter mirrors this into data-flight-live (head-dot glow handoff). */
  onLiveChange?: (live: boolean) => void;
}) {
  // The canvas drives these DOM cards every frame (driveHolo) — no tweens, no state.
  const holoLayerRef = useRef<HTMLDivElement>(null);
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
              holoLayer={holoLayerRef}
              running={inView}
              onLive={handleLive}
              onDead={handleDead}
            />
          </div>
          {/* L2 — flat contrast scrim over the LIVE canvas only */}
          <div className="absolute inset-0 bg-base/25" />
          {/* L3 — left-column guard: extra darkening under the card column */}
          <div className="absolute inset-0 [background:linear-gradient(90deg,oklch(14.5%_0.012_278/0.40)_0%,oklch(14.5%_0.012_278/0.28)_50%,transparent_72%)]" />
          {/* L3.5 — HOLOGRAM CARDS (holo pivot): child k is beacon k's readable card.
              The canvas positions/scales/fades these every frame as a pure function
              of scroll (driveHolo) — transform+opacity only, so no layout ever runs.
              Inside the aria-hidden wrapper: duplicate content, invisible to AT. */}
          <div ref={holoLayerRef} className="absolute inset-0 [perspective:1400px]">
            {holo.map((item, i) => (
              <div
                key={i}
                className="absolute left-0 top-0 w-[320px] rounded-[16px] p-[18px] opacity-0 will-change-[transform,opacity]
                  bg-[linear-gradient(180deg,oklch(20%_0.016_278/0.86),oklch(14.5%_0.012_278/0.78))]
                  shadow-[0_0_0_1px_oklch(66%_0.19_285/0.28),0_18px_50px_-22px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(235,236,250,0.10)]"
              >
                {/* glow layer — the canvas maps the arrival flare onto its opacity */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[inherit] opacity-0
                    shadow-[0_0_0_1px_oklch(86%_0.115_207/0.75),0_0_44px_-6px_oklch(86%_0.115_207/0.65),0_0_90px_-12px_oklch(66%_0.19_285/0.55)]"
                />
                {/* scan edge — thin cyan leading line, echoes the DOM cards */}
                <span
                  aria-hidden
                  className="absolute left-[18px] top-0 h-[2px] w-[46px] rounded-[2px] bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-cyan))] opacity-90"
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-cyan">
                  {item.kicker}
                </p>
                <p className="mt-1.5 font-display text-[19px] font-semibold leading-[1.22] tracking-[-0.01em] text-ink">
                  {item.title}
                </p>
                {item.line ? (
                  <p className="mt-2 font-mono text-[11.5px] leading-snug text-ok">
                    ↗ {item.line}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {/* L4 — vignette, always painted (poster AND live) — DescentArena formula. */}
      <div className="absolute inset-0 [background:radial-gradient(135%_115%_at_50%_36%,transparent_50%,oklch(14.5%_0.012_278/0.55)_100%),linear-gradient(to_bottom,oklch(14.5%_0.012_278/0.45)_0%,transparent_14%,transparent_82%,oklch(14.5%_0.012_278/0.5)_100%)]" />
    </div>
  );
}
