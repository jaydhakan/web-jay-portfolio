"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, loadExtraPlugins } from "@/lib/gsap";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";
import { siteConfig } from "@/data/content";

const NAME = (siteConfig.name || "Jay Dhakan").toUpperCase();

/**
 * The choreographed opening (Phase 8, D-1/D-7). A session-once preloader
 * scramble-decodes "JAY DHAKAN" (signal from noise), then exits via the
 * signature clip wipe straight into an orchestrated hero reveal (nav slide →
 * H1 masked-line rise → sub-copy/CTA stagger → backdrop scale-in). Scroll is
 * locked (`lenis.stop()`) until the timeline completes.
 *
 * DESKTOP-ONLY (R4 — "mobile is a deliberate simplified experience"). The
 * pre-paint gate script in layout.tsx sets `html[data-preloader="pending"]`
 * ONLY for a first visit on a >=768px fine-pointer viewport with motion allowed.
 * Any full-screen first-load overlay covers the hero H1 (the LCP element) and
 * was measured to sink mobile Performance below the 95 gate (R9); desktop has
 * the headroom, so the dramatic opening lives there while mobile keeps the fast
 * LCP-safe CSS entrance. Repeat visit / touch / reduced motion / no-JS never set
 * the attribute, so the overlay stays display:none and this timeline no-ops.
 *
 * LCP SAFETY (even on the gated desktop path): the overlay is opaque and covers
 * the hero, but the H1 still paints at opacity:1 underneath on first paint. We
 * defer hiding it for the masked reveal to a double-rAF (post first paint) so its
 * opacity:1 paint registers before we touch it. A CSS + JS failsafe guarantees
 * the overlay can never strand a user.
 */
export function OpeningChoreo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenisInstance();

  useGSAP(
    () => {
      const docEl = document.documentElement;
      if (docEl.dataset.preloader !== "pending") return; // gate (see header)

      const overlay = rootRef.current;
      const nameEl = overlay?.querySelector<HTMLElement>("[data-preloader-name]");
      const barEl = overlay?.querySelector<HTMLElement>("[data-preloader-bar]");

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        lenis?.start();
        try {
          sessionStorage.setItem("jd-seen", "1");
        } catch {
          /* private mode — the opening simply replays next load, harmless */
        }
        delete docEl.dataset.preloader; // -> overlay returns to display:none
        ScrollTrigger.refresh();
      };

      if (!overlay || !nameEl || !barEl) {
        finish();
        return;
      }

      lenis?.stop();
      // Hard failsafe: a thrown tween can never strand the user behind the overlay.
      const failsafe = window.setTimeout(finish, 3200);

      let tl: gsap.core.Timeline | null = null;
      let cancelled = false;
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // ScrambleText is lazy now — load the extras chunk, then build the TL.
          void loadExtraPlugins().then(() => {
          if (cancelled) return;
          const heroLines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
          const heroRise = gsap.utils.toArray<HTMLElement>("[data-hero-rise]");
          const header = document.querySelector("header");
          const fallback = document.querySelector<HTMLElement>(".hero-fallback");

          tl = gsap.timeline({
            defaults: { ease: "expo.out" },
            onComplete: () => {
              window.clearTimeout(failsafe);
              finish();
            },
          });

          // Hidden start states, set HERE (post-paint, under the opaque overlay):
          // the hero H1 has already registered its opacity:1 paint before we
          // touch it, and these run well before the wipe uncovers them (no flash).
          gsap.set(overlay, { clipPath: "inset(0% 0% 0% 0%)" });
          gsap.set(barEl, { scaleX: 0 });
          if (fallback) gsap.set(fallback, { opacity: 0, scale: 1.05 });
          if (header) gsap.set(header, { yPercent: -100, opacity: 0 });
          if (heroLines.length) gsap.set(heroLines, { yPercent: 110 });
          if (heroRise.length) gsap.set(heroRise, { y: 26, opacity: 0 });

          // 1) Scramble-decode "JAY DHAKAN" (signal from noise) + hairline fill.
          tl.to(
            nameEl,
            {
              duration: 0.8,
              scrambleText: { text: NAME, chars: "01", speed: 0.5, revealDelay: 0.3 },
              ease: "none",
            },
            0,
          ).to(barEl, { scaleX: 1, duration: 0.85, ease: "power2.inOut" }, 0);

          // 2) Preloader exits via the signature clip wipe (reveals top-first).
          tl.to(
            overlay,
            { clipPath: "inset(100% 0% 0% 0%)", duration: 0.6, ease: "jdFlow" },
            0.95,
          ).to([nameEl, barEl], { yPercent: -50, opacity: 0, duration: 0.4, ease: "power2.in" }, 0.95);

          // 3) Hero entrance — overlaps the wipe so content rises in as it clears.
          if (fallback) tl.to(fallback, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 0.95);
          if (header) tl.to(header, { yPercent: 0, opacity: 1, duration: 0.55 }, 1.0);
          if (heroLines.length) tl.to(heroLines, { yPercent: 0, duration: 0.7, stagger: 0.1 }, 1.1);
          if (heroRise.length) tl.to(heroRise, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 }, 1.3);
          });
        }),
      );

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.clearTimeout(failsafe);
        tl?.kill();
        finish();
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      id="jd-preloader"
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-[55] flex-col items-center justify-center gap-5 bg-base"
    >
      <span
        data-preloader-name
        className="font-mono text-2xl font-medium uppercase tracking-[0.3em] text-ink sm:text-3xl"
      >
        {NAME}
      </span>
      <span
        aria-hidden
        data-preloader-bar
        className="block h-px w-40 origin-left bg-accent"
      />
    </div>
  );
}
