"use client";

import { useState } from "react";
import type { Project, ProjectCategory } from "@/data/content";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/work/ProjectCard";
import { SerpentineTimeline } from "@/components/timeline/SerpentineTimeline";

type Filter = "All" | ProjectCategory;

type WorkGeolineProps = {
  projects: Project[];
  /** slug -> cover file exists (computed server-side). */
  covers: Record<string, boolean>;
  filters: readonly Filter[];
};

/**
 * The /work timeline — a thin data adapter over the shared <SerpentineTimeline>
 * "Synapse" engine (the SAME engine the /about journey uses; see PORTFOLIO_UPGRADE_PLAN
 * Phase 4). Each shipped system is a synapse on the bold serpentine; the scroll orb
 * lights them one by one. This wrapper owns ONLY: the category-filter pills, the
 * filter SPOTLIGHT (dim non-matching synapses + cards, never reflow -> the drawn wire
 * and CLS stay intact), and the clickable ProjectCard render-prop. The previous sticky
 * case-study preview was dropped so the swing can go full-width and /work + /about read
 * as one engine; the rich card + the /work/[slug] case study carry that detail.
 */
export function WorkGeoline({ projects, covers, filters }: WorkGeolineProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const matches = (p: Project) => filter === "All" || p.category === filter;

  return (
    <div className="relative">
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

      <div className="mt-12">
        <SerpentineTimeline
          count={projects.length}
          hudLabel="Systems lit"
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
              />
            );
          }}
        />
      </div>
    </div>
  );
}
