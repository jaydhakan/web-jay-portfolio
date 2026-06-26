"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import type { Project, ProjectCategory } from "@/data/content";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ProjectPreview } from "@/components/work/ProjectPreview";

type Filter = "All" | ProjectCategory;

type WorkGeolineProps = {
  projects: Project[];
  /** slug -> cover file exists (computed server-side). */
  covers: Record<string, boolean>;
  filters: readonly Filter[];
};

/**
 * The Work geoline (P2) — the shipped systems as a guided, scroll-drawn product
 * journey instead of a flat row list. A glowing spine runs down the left of the
 * card column: a faint base rail with an accent line that DRAWS downward with
 * scroll progress (a `--draw` CSS var written once per frame off a scrubbed
 * ScrollTrigger — compositor-cheap, no per-frame React), a white-hot orb riding
 * its leading edge, and a node per project that IGNITES (hollow indigo -> filled
 * cyan + halo) as its card reaches centre. A sticky case-study PREVIEW on the
 * right reflects the project nearest the orb, or whichever card is hovered/focused.
 *
 * Category filter pills don't reflow the path (which would break the draw + CLS):
 * they SPOTLIGHT a category by dimming the non-matching cards/nodes. Distinct from
 * the /about journey meridian on purpose (left-anchored spine, rich clickable
 * cards), so the two timelines never read as the same component.
 *
 * A11y / R7: one real <ol> of project links (announced); the spine, orb, nodes and
 * mobile rail are aria-hidden decoration. Cards ship visible; the draw + orb are
 * the only motion and are motion-safe-gated, so reduced motion / no-JS get a clean
 * static left-rail timeline. Mobile drops the sticky preview for an inline cover
 * thumb inside each card (no horizontal overflow, no cursor-follow on touch).
 */
export function WorkGeoline({ projects, covers, filters }: WorkGeolineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const matches = (p: Project) => filter === "All" || p.category === filter;
  const previewIndex = hovered ?? active;
  const previewProject = projects[previewIndex] ?? projects[0];

  useGSAP(
    () => {
      // Active tracking — which card owns the viewport centre (drives the lit
      // nodes + the default preview). Scroll-position -> state only (no animation),
      // so it runs regardless of reduced motion.
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });
      });

      // The draw + orb are the section's one motion moment — desktop/mobile with
      // motion allowed only. The spine rides a scrubbed trigger writing `--draw`.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const spine = spineRef.current;
        const col = colRef.current;
        if (!spine || !col) return;
        const st = ScrollTrigger.create({
          trigger: col,
          start: "top 78%",
          end: "bottom 62%",
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            spine.style.setProperty("--draw", self.progress.toFixed(4));
          },
        });
        return () => st.kill();
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
      {/* Filter pills — spotlight a category (dim others), no reflow. */}
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2.5">
        {filters.map((f) => {
          const selected = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(f)}
              className={cn(
                "focus-pill rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97] focus-visible:outline-none",
                selected
                  ? "bg-accent-solid text-white"
                  : "border border-line bg-surface text-ink-dim hover:border-accent/40 hover:text-ink",
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* No `items-start`: the right grid cell must STRETCH to the cards column
          height so the sticky preview inside it has full scroll range to track. */}
      <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        {/* Left: spine + nodes + project cards. */}
        <div ref={colRef} className="relative">
          {/* Spine track (decorative). Base rail + drawn accent line + orb. */}
          <div
            ref={spineRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-4 w-0.5 -translate-x-1/2 md:left-[22px]"
            style={{ ["--draw" as string]: "0" }}
          >
            <div className="absolute inset-0 rounded-full bg-line" />
            <div
              className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-accent via-accent-violet to-accent-cyan"
              style={{ height: "calc(var(--draw) * 100%)" }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
              style={{ top: "calc(var(--draw) * 100%)" }}
            >
              <span className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/15" />
              <span className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/40" />
              <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px_var(--color-accent-cyan)]" />
            </div>
          </div>

          <ol className="relative space-y-5 pl-10 md:pl-14">
            {projects.map((project, i) => {
              const lit = i <= active;
              const current = i === active;
              const dimmed = !matches(project);
              return (
                <li
                  key={project.slug}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="relative"
                >
                  {/* Node bead on the spine (desktop + mobile rail share it). */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[-1.5rem] top-8 z-10 -translate-y-1/2 transition-opacity duration-300 md:left-[-2rem]",
                      dimmed && "opacity-40",
                    )}
                  >
                    <span className="relative grid size-3.5 place-items-center">
                      {/* halo — current project only */}
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full bg-accent-cyan/25 transition-[transform,opacity] duration-500",
                          current ? "scale-[2] opacity-100" : "scale-100 opacity-0",
                        )}
                      />
                      {/* bead — idle hollow indigo -> lit filled cyan */}
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full border transition-colors duration-500",
                          lit
                            ? "border-accent-cyan bg-accent-cyan"
                            : "border-accent/45 bg-base",
                        )}
                      />
                    </span>
                  </span>

                  {/* Short tether from the spine to the card. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[-1.5rem] top-8 h-px w-4 -translate-y-1/2 bg-gradient-to-r from-accent/50 to-transparent transition-opacity duration-300 md:left-[-2rem] md:w-6",
                      lit ? "opacity-80" : "opacity-30",
                      dimmed && "opacity-20",
                    )}
                  />

                  <ProjectCard
                    project={project}
                    index={i}
                    hasCover={covers[project.slug] ?? false}
                    active={current && hovered === null}
                    dimmed={dimmed}
                    onActivate={() => setHovered(i)}
                    onDeactivate={() => setHovered((h) => (h === i ? null : h))}
                  />
                </li>
              );
            })}
          </ol>
        </div>

        {/* Right: sticky case-study preview (lg+ only). */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <ProjectPreview project={previewProject} hasCover={covers[previewProject.slug] ?? false} />
          </div>
        </div>
      </div>
    </div>
  );
}
