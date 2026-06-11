"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { Project, ProjectCategory } from "@/data/content";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { cn } from "@/lib/utils";

type Filter = "All" | ProjectCategory;

type WorkGridProps = {
  projects: Project[];
  /** slug -> cover file exists (computed server-side). */
  covers: Record<string, boolean>;
  filters: readonly Filter[];
};

/**
 * Filter pills + project grid. The first card of the active set spans the
 * full row as the featured lead (varied rhythm, not a uniform grid).
 * Filtering animates via shared layout; reduced motion swaps instantly.
 */
export function WorkGrid({ projects, covers, filters }: WorkGridProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<Filter>("All");

  const visible = projects.filter((p) => active === "All" || p.category === active);

  return (
    <div>
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2.5">
        {filters.map((filter) => {
          const selected = filter === active;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(filter)}
              className={cn(
                "rounded-full px-4.5 py-2 text-sm font-medium transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                "active:scale-[0.97]",
                selected
                  ? "bg-accent-solid text-white"
                  : "border border-token bg-surface text-secondary hover:border-accent-primary/40 hover:text-primary",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <LayoutGroup>
        <motion.ul layout={!reduceMotion} className="mt-12 grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project, i) => (
              <motion.li
                key={project.slug}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(i === 0 && "md:col-span-2")}
              >
                <ProjectCard
                  project={project}
                  hasCover={covers[project.slug] ?? false}
                  size={i === 0 ? "featured-large" : "grid"}
                  priority={i === 0}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>
    </div>
  );
}
