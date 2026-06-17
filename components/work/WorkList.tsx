"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger, useExtraPlugins, getFlip, DUR } from "@/lib/gsap";
import type { Flip } from "gsap/Flip";
import type { Project, ProjectCategory } from "@/data/content";
import { blurProps } from "@/lib/blur";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

type Filter = "All" | ProjectCategory;

type WorkListProps = {
  projects: Project[];
  /** slug -> cover file exists (computed server-side). */
  covers: Record<string, boolean>;
  filters: readonly Filter[];
};

const PLACEHOLDER_BG =
  "radial-gradient(ellipse 80% 90% at 70% 20%, oklch(63% 0.21 272 / 0.16), transparent 65%)";

/**
 * Project index as a hairline-divided row list (catalog #18). On desktop a
 * framed cover preview lerps after the cursor and swaps per hovered row; mobile
 * gets an inline thumbnail per row instead. Filtering reflows the rows with GSAP
 * Flip and refreshes ScrollTrigger afterward. Covers render the real file when
 * present, else an honest gradient slot with the title (no fake screenshots).
 */
export function WorkList({ projects, covers, filters }: WorkListProps) {
  const [active, setActive] = useState<Filter>("All");
  const [hovered, setHovered] = useState<Project | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  useExtraPlugins(); // kicks the lazy Flip load on mount; ready before any click

  const isVisible = (p: Project) => active === "All" || p.category === active;

  const onFilter = (filter: Filter) => {
    if (filter === active || !rootRef.current) return;
    const Flip = getFlip();
    // If Flip hasn't loaded yet, fall back to an instant reflow (no animation).
    flipState.current = Flip
      ? Flip.getState(rootRef.current.querySelectorAll(".work-row"))
      : null;
    setActive(filter);
  };

  // Flip reflow after the active filter changes, then refresh ScrollTrigger.
  useGSAP(
    () => {
      const state = flipState.current;
      const Flip = getFlip();
      flipState.current = null;
      if (state && Flip) {
        Flip.from(state, {
          duration: 0.5,
          ease: "expo.out",
          absolute: true,
          onEnter: (els) =>
            gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }),
          onLeave: (els) => gsap.to(els, { opacity: 0, y: -10, duration: 0.25 }),
        });
      }
      const r = requestAnimationFrame(() =>
        requestAnimationFrame(() => ScrollTrigger.refresh()),
      );
      return () => cancelAnimationFrame(r);
    },
    { dependencies: [active], scope: rootRef },
  );

  // Cursor-follow preview, desktop + fine pointer + motion-allowed only.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = previewRef.current;
          const root = rootRef.current;
          if (!el || !root) return;
          const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "expo.out" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "expo.out" });
          const onMove = (e: PointerEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
          };
          root.addEventListener("pointermove", onMove, { passive: true });
          return () => root.removeEventListener("pointermove", onMove);
        },
      );
    },
    { scope: rootRef },
  );

  // Staggered entrance for the rows — the site's reveal grammar applied to the
  // list (which previously had none). One-shot per row, motion-safe; the start
  // state is set at runtime (never CSS-hidden), so no-JS / reduced-motion render
  // the rows at rest, and it stays clear of the Flip filtering (which owns its
  // own enter/leave tweens).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = gsap.utils.toArray<HTMLElement>(".work-row");
        rows.forEach((row) => {
          gsap.from(row, {
            opacity: 0,
            y: 30,
            duration: DUR.std,
            ease: "expo.out",
            scrollTrigger: { trigger: row, start: "top 90%", once: true },
          });
        });
      });
    },
    { scope: rootRef },
  );

  const hoveredHasCover = hovered ? (covers[hovered.slug] ?? false) : false;
  // Ambient, sequential index per VISIBLE row (renumbers on filter). Decorative.
  const visibleIndex = new Map(projects.filter(isVisible).map((p, i) => [p.slug, i + 1]));

  return (
    <div ref={rootRef} className="relative">
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2.5">
        {filters.map((filter) => {
          const selected = filter === active;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilter(filter)}
              className={cn(
                "focus-pill rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97] focus-visible:outline-none",
                selected
                  ? "bg-accent-solid text-white"
                  : "border border-line bg-surface text-ink-dim hover:border-accent/40 hover:text-ink",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <ul className="mt-10 border-t border-line">
        {projects.map((project) => {
          const shown = isVisible(project);
          const hasCover = covers[project.slug] ?? false;
          return (
            <li
              key={project.slug}
              data-flip-id={project.slug}
              data-cursor="view"
              className={cn("work-row border-b border-line", !shown && "hidden")}
              onMouseEnter={() => setHovered(project)}
              onMouseLeave={() => setHovered((h) => (h === project ? null : h))}
            >
              <Link
                href={`/work/${project.slug}`}
                className="group flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:gap-6"
              >
                {/* Ambient index — editorial depth, decorative. */}
                <span
                  aria-hidden
                  className="hidden shrink-0 font-mono text-sm tabular-nums text-ink-dim/50 transition-colors duration-300 group-hover:text-accent sm:block"
                >
                  {String(visibleIndex.get(project.slug) ?? 0).padStart(2, "0")}
                </span>

                {/* Mobile inline thumb (desktop uses the cursor-follow preview). */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-elevated ring-1 ring-line sm:hidden">
                  {hasCover ? (
                    <Image src={project.coverImage} alt="" fill sizes="(min-width: 640px) 1px, 100vw" className="object-cover" {...blurProps(project.coverImage)} />
                  ) : (
                    <div aria-hidden className="size-full" style={{ backgroundImage: PLACEHOLDER_BG }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-semibold text-ink transition-colors duration-200 group-hover:text-accent sm:text-3xl">
                    {project.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-dim">
                    {project.industry}, {project.year}
                  </p>
                </div>

                <div className="hidden flex-wrap gap-2 sm:flex">
                  {project.tech.slice(0, 3).map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </div>

                <ArrowUpRight
                  aria-hidden
                  className="size-5 shrink-0 text-ink-dim transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Cursor-follow preview (desktop). */}
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden transition-opacity duration-300 md:block"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <div className="-translate-y-1/2 translate-x-8">
          <div className="relative aspect-video w-[min(26vw,340px)] overflow-hidden rounded-xl bg-elevated shadow-glow ring-1 ring-line">
            {hovered &&
              (hoveredHasCover ? (
                // Plain image on purpose: this floating preview is pointer-events-none
                // (so the flow hover-melt can never fire) and swaps on every row hover
                // (a WebGL canvas would churn GL contexts for no interactive payoff).
                // The flowmap lives on the IN-PLACE covers — home featured + case study.
                <Image src={hovered.coverImage} alt="" fill sizes="340px" className="object-cover" {...blurProps(hovered.coverImage)} />
              ) : (
                <div className="flex size-full items-end p-4" style={{ backgroundImage: PLACEHOLDER_BG }}>
                  <span className="font-display text-sm font-semibold text-ink">{hovered.title}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
