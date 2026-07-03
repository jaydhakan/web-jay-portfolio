"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectCategory } from "@/data/content";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/work/ProjectCard";
import { SerpentineTimeline } from "@/components/timeline/SerpentineTimeline";
import { scoreForCount } from "@/components/timeline/argmax";

type Filter = "All" | ProjectCategory;

/** label -> stable id, so a stack shared across systems bridges them in the graph. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  // Each system's stack becomes its constellation stars; a stack used by more than one
  // system bridges them — the shared-backbone graph (Python, AsyncIO, REST…) lights up
  // as you scroll. Capped to 3 per system so the gutter never crowds. Memoized for a
  // stable identity (it feeds the engine geometry + timeline).
  const constellation = useMemo(
    () => projects.map((p) => p.tech.slice(0, 3).map((t) => ({ id: slug(t), label: t }))),
    [projects],
  );

  // Featured systems are the heavy beats of the /work bolt (bigger fans, harder kinks,
  // brighter collapses); the rest get deterministic varied weights from the score.
  const beats = useMemo(
    () => scoreForCount(projects.length, projects.map((p) => (p.featured ? 0.9 : undefined))),
    [projects],
  );

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
          beats={beats}
          constellation={constellation}
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
