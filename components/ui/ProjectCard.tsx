import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Project } from "@/data/content";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  /** Computed by server callers via publicImageExists (fs is server-only). */
  hasCover: boolean;
  /** featured-large: bento lead. featured-small: bento side. grid: /work index. */
  size?: "featured-large" | "featured-small" | "grid";
  priority?: boolean;
  /** Heading level so the card nests correctly: h3 under a section h2 (home),
      h2 directly under the page h1 (/work index). Keeps axe heading-order valid. */
  headingLevel?: "h2" | "h3";
};

/**
 * Whole card is one link. Cover renders the real file when it exists in
 * /public; until then a designed placeholder slot (no fake screenshots).
 */
export function ProjectCard({
  project,
  hasCover,
  size = "grid",
  priority = false,
  headingLevel = "h3",
}: ProjectCardProps) {
  const isLarge = size === "featured-large";
  const Heading = headingLevel;

  return (
    <Link
      href={`/work/${project.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-token bg-surface",
        "transition duration-200 ease-out hover:border-accent-primary/40 hover:shadow-glow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-base",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          isLarge ? "aspect-[16/10]" : "aspect-video",
        )}
      >
        {hasCover ? (
          <Image
            src={project.coverImage}
            alt={`${project.title}: ${project.description}`}
            fill
            priority={priority}
            sizes={
              isLarge
                ? "(min-width: 1024px) 60vw, 100vw"
                : "(min-width: 1024px) 40vw, 100vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          // TODO(JAY): drop the real screenshot at public{project.coverImage}
          <div
            aria-hidden
            className="size-full bg-elevated transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 90% at 70% 20%, color-mix(in oklab, var(--accent-primary) 14%, transparent), transparent 65%)",
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-base/30 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-token bg-base/80 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
            View case study
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", isLarge ? "p-7" : "p-6")}>
        <div className="flex items-center gap-3">
          <Tag>{project.industry}</Tag>
          <span className="text-xs text-secondary">{project.year}</span>
        </div>
        <Heading
          className={cn(
            "mt-4 font-display font-semibold text-primary",
            isLarge ? "text-2xl lg:text-3xl" : "text-xl",
          )}
        >
          {project.title}
        </Heading>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{project.description}</p>
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2">
            {project.tech.slice(0, 3).map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-success">
            <TrendingUp aria-hidden className="size-4" />
            {project.result}
          </p>
        </div>
      </div>
    </Link>
  );
}
