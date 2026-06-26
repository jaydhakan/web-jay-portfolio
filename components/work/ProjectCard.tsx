import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Project } from "@/data/content";
import { blurProps } from "@/lib/blur";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

const PLACEHOLDER_BG =
  "radial-gradient(ellipse 80% 90% at 70% 20%, oklch(63% 0.21 272 / 0.16), transparent 65%)";

/**
 * A shipped-product card on the Work geoline (P2). Reads as a real system, not a
 * text row: index, category, year, title, one-line outcome, the headline result
 * metric, the stack, and an action arrow. The whole card is the link. Built on
 * the shared `.surface-card` language; hover + scroll-active layer on an accent
 * ring + lift + arrow nudge (transform/opacity/color only — no box-shadow tween
 * on scroll). The cover thumb shows below lg (where the sticky preview is hidden).
 */
export function ProjectCard({
  project,
  index,
  hasCover,
  active,
  dimmed,
  onActivate,
  onDeactivate,
}: {
  project: Project;
  index: number;
  hasCover: boolean;
  active: boolean;
  dimmed: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor="view"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onMouseLeave={onDeactivate}
      onBlur={onDeactivate}
      className={cn(
        "surface-card group block overflow-hidden p-5 transition-[transform,border-color,opacity] duration-300 ease-out sm:p-6",
        "hover:-translate-y-0.5 hover:border-accent/35 focus-visible:border-accent/35",
        // The accent glow + top accent line live in ::before / a child (opacity-tweened, never box-shadow).
        active && "border-accent/45",
        dimmed && "opacity-40",
      )}
    >
      {/* Accent bloom — pre-rendered, faded in on hover / scroll-active. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300",
          "[background:radial-gradient(120%_80%_at_0%_0%,oklch(63%_0.21_272/0.12),transparent_60%)]",
          "group-hover:opacity-100",
          active && "opacity-100",
        )}
      />

      <div className="relative flex flex-col gap-5">
        {/* Mobile / tablet cover (lg+ uses the sticky preview panel). */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-elevated ring-1 ring-line lg:hidden">
          {hasCover ? (
            <Image
              src={project.coverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 1px, 100vw"
              className="object-cover"
              {...blurProps(project.coverImage)}
            />
          ) : (
            <div aria-hidden className="size-full" style={{ backgroundImage: PLACEHOLDER_BG }} />
          )}
        </div>

        <div>
          {/* Header: index · category .................. year */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-mono text-sm tabular-nums transition-colors duration-300",
                  active ? "text-accent" : "text-ink-dim/60 group-hover:text-accent",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <Tag className="border border-line bg-transparent text-ink-dim">
                {project.category}
              </Tag>
            </div>
            <span className="font-mono text-xs tabular-nums text-ink-dim">{project.year}</span>
          </div>

          <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-ink transition-colors duration-300 group-hover:text-accent">
            {project.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">{project.description}</p>

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ok">
            <TrendingUp aria-hidden className="size-4" />
            {project.result}
          </p>

          {/* Footer: stack ......................... action arrow */}
          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {project.tech.slice(0, 4).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-[transform,color,border-color] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-accent/40 group-hover:text-accent"
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
