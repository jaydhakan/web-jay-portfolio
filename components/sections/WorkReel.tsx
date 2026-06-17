"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Project } from "@/data/content";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { FlowImage } from "@/components/media/FlowImage";
import { Tag } from "@/components/ui/Tag";

const PLACEHOLDER_BG =
  "radial-gradient(ellipse 85% 90% at 70% 25%, oklch(63% 0.21 272 / 0.18), transparent 60%)";

/**
 * Horizontal cinematic work reel (V3 P7 / S6) — the featured projects as a film,
 * not a list. On desktop + motion the section PINS and the vertical wheel drives
 * a lateral journey: a track of full-height panels scrolls horizontally via a
 * scrubbed ScrollTrigger (Lenis stays the single scroll source). Inside each
 * panel the cover and the copy parallax at different rates as the panel crosses
 * the viewport (depth), the cover clip-reveals on entry, and a giant ambient
 * index sits behind it. A progress bar tracks the journey so it never feels
 * trapped (risk #4: cap pin length, clear cues, no snap traps).
 *
 * Covers reuse the P6 FlowImage (governed WebGL flowmap; still next/image as the
 * SSR / a11y / LCP layer underneath). Reduced motion + mobile get a plain
 * vertical scrolling stack (R4) — no pin, no horizontal scroll-jacking on touch.
 */
export function WorkReel({
  featured,
  covers,
}: {
  featured: Project[];
  covers: Record<string, boolean>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current;
        const track = trackRef.current;
        const progress = progressRef.current;
        if (!root || !track) return;

        // How far the track must travel left to reveal its last panel.
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        // The pin length equals the horizontal travel, so 1px of wheel ≈ 1px of
        // lateral move (capped feel, no over-long pin). invalidateOnRefresh
        // recomputes on resize / font-swap / route change.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progress) progress.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
        tl.to(track, { x: () => -distance(), ease: "none" });

        // Per-panel parallax: cover and copy drift at different rates as the
        // track moves, giving depth (compositor-only x transforms).
        const panels = gsap.utils.toArray<HTMLElement>(".reel-panel", track);
        panels.forEach((panel) => {
          const cover = panel.querySelector<HTMLElement>("[data-reel-cover]");
          const copy = panel.querySelector<HTMLElement>("[data-reel-copy]");
          const index = panel.querySelector<HTMLElement>("[data-reel-index]");
          if (cover) gsap.fromTo(cover, { xPercent: -6 }, {
            xPercent: 6, ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
          });
          if (copy) gsap.fromTo(copy, { xPercent: 14 }, {
            xPercent: -14, ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
          });
          if (index) gsap.fromTo(index, { xPercent: 30 }, {
            xPercent: -30, ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
          });
        });

        // Refresh once after layout settles (covers / fonts) so distance() is right.
        const r = requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => cancelAnimationFrame(r);
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="reel-root relative overflow-hidden">
      {/* Progress bar — desktop pinned act only (hidden on the vertical fallback). */}
      <div aria-hidden className="absolute inset-x-0 top-0 z-20 hidden h-0.5 bg-line motion-safe:md:block">
        <div
          ref={progressRef}
          className="h-full origin-left scale-x-0 bg-accent-solid"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* The track. Desktop + motion: a single horizontal row pinned + scrubbed.
          Mobile OR reduced motion: a normal vertical column (no pin fires, no
          horizontal travel) — so the row layout is gated on motion-safe:md, not
          md alone, or RM-on-desktop would clip an unreachable horizontal row. */}
      <div
        ref={trackRef}
        className="flex flex-col gap-6 motion-safe:md:h-[100dvh] motion-safe:md:flex-row motion-safe:md:flex-nowrap motion-safe:md:gap-0 motion-safe:md:will-change-transform"
      >
        {featured.map((project, i) => {
          const hasCover = covers[project.slug] ?? false;
          return (
            <article
              key={project.slug}
              data-cursor="view"
              className="reel-panel relative flex shrink-0 items-center motion-safe:md:h-full motion-safe:md:w-screen motion-safe:md:px-[7vw]"
            >
              {/* Giant ambient index — editorial depth, decorative. */}
              <span
                aria-hidden
                data-reel-index
                className="pointer-events-none absolute -top-6 left-2 select-none font-display text-[34vw] font-bold leading-none text-ink/[0.03] md:left-[4vw] md:text-[22vw]"
                style={{ willChange: "transform" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="relative z-10 grid w-full items-center gap-6 md:grid-cols-[1.25fr_1fr] md:gap-12">
                <div
                  data-reel-cover
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-white/[0.06] md:aspect-[4/3]"
                  style={{ willChange: "transform" }}
                >
                  {hasCover ? (
                    <FlowImage
                      src={project.coverImage}
                      alt=""
                      sizes="(min-width: 768px) 55vw, 100vw"
                    />
                  ) : (
                    <div aria-hidden className="size-full" style={{ backgroundImage: PLACEHOLDER_BG }} />
                  )}
                </div>

                <div data-reel-copy style={{ willChange: "transform" }}>
                  <div className="flex items-center gap-3">
                    <Tag>{project.industry}</Tag>
                    <span className="text-xs text-ink-dim">{project.year}</span>
                  </div>
                  <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
                    {project.title}
                  </h3>
                  <p className="mt-4 max-w-md leading-relaxed text-ink-dim">{project.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.tech.slice(0, 4).map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                  <p className="mt-6 flex items-center gap-1.5 text-sm font-medium text-ok">
                    <TrendingUp aria-hidden className="size-4" />
                    {project.result}
                  </p>
                  <Link
                    href={`/work/${project.slug}`}
                    className="group mt-7 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ink transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base"
                  >
                    View case study
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
