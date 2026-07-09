"use client";

import { useMemo, useRef, useState } from "react";
import type { Project, ProjectCategory } from "@/data/content";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/work/ProjectCard";
import { SerpentineTimeline } from "@/components/timeline/SerpentineTimeline";
import { scoreForCount } from "@/components/timeline/argmax";
import { createSpineProgress, type SpineProgress } from "@/components/timeline/flight-progress";
import { FlightBackdrop } from "@/components/flight/FlightBackdrop";

type Filter = "All" | ProjectCategory;

type WorkGeolineProps = {
  projects: Project[];
  /** slug -> cover file exists (computed server-side). */
  covers: Record<string, boolean>;
  filters: readonly Filter[];
};

/**
 * The /work timeline — a thin data adapter over the shared <SerpentineTimeline>
 * "Constellation Spine" engine (the SAME engine the /about journey uses). Each shipped
 * system is a node on the rail; featured systems are the heavy beats (louder cards +
 * nodes). This wrapper owns ONLY: the category-filter pills, the filter's ATTENTION
 * MASKING (dim non-matching nodes/cards — never a reflow, so CLS stays 0), and the
 * clickable ProjectCard render-prop; the rich card + the /work/[slug] case study carry
 * the detail.
 */
export function WorkGeoline({ projects, covers, filters }: WorkGeolineProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const matches = (p: Project) => filter === "All" || p.category === filter;

  // Featured systems are the heavy beats of the /work spine (bigger cards, brighter
  // nodes); the rest get deterministic varied weights from the score.
  const beats = useMemo(
    () => scoreForCount(projects.length, projects.map((p) => (p.featured ? 0.9 : undefined))),
    [projects],
  );

  // The Flight's progress bus + section gate (see Geoline for the ancestor-transform
  // invariant). idleArm: /work's timeline sits near the fold, so the heavy chunk
  // additionally waits for idle/first input (Lighthouse TBT protection).
  const spine = useRef<SpineProgress>(createSpineProgress());
  const sectionRef = useRef<HTMLDivElement>(null);
  const [flightLive, setFlightLive] = useState(false);

  return (
    <div ref={sectionRef} data-flight-live={flightLive || undefined} className="relative">
      <FlightBackdrop
        sectionRef={sectionRef}
        spine={spine}
        beats={beats}
        glyphSet="numerals"
        idleArm
        onLiveChange={setFlightLive}
      />
      {/* Filter pills — spotlight a category (dim others), no reflow. */}
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2.5">
        {filters.map((f) => {
          const selected = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setFilter(f);
                // Mirror the filter into the Flight: beacons dim in place (never
                // removed — the CLS doctrine, same as the cards' opacity-40).
                spine.current.dimmed = projects.map(
                  (p) => !(f === "All" || p.category === f),
                );
              }}
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

      {/* Card titles are h3 (shared with other h2-sectioned contexts); this sr-only
          h2 keeps /work's outline sequential under the page h1 (a11y heading-order). */}
      <h2 className="sr-only">Shipped systems</h2>
      <div className="mt-12">
        <SerpentineTimeline
          count={projects.length}
          hudLabel="Systems lit"
          beats={beats}
          flightRef={spine}
          dimmed={(i) => !matches(projects[i])}
          renderCard={(i, _side, isActive) => {
            const project = projects[i];
            return (
              <ProjectCard
                project={project}
                index={i}
                hasCover={covers[project.slug] ?? false}
                active={isActive}
                dimmed={!matches(project)}
                priority={i === 0}
              />
            );
          }}
        />
      </div>
    </div>
  );
}
