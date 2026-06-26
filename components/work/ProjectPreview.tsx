import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Project, Stat } from "@/data/content";
import { blurProps } from "@/lib/blur";
import { Tag } from "@/components/ui/Tag";

const PLACEHOLDER_BG =
  "radial-gradient(ellipse 90% 90% at 70% 20%, oklch(63% 0.21 272 / 0.22), transparent 62%)";

/** "<$3", "15M+", "99.9%" — exact, no count-up (the preview swaps too often). */
function formatStat(s: Stat): string {
  const n = s.decimals ? s.value.toFixed(s.decimals) : String(s.value);
  return `${s.prefix ?? ""}${n}${s.suffix ?? ""}`;
}

/**
 * Sticky case-study preview (P2) — the reworked, no-longer-faint right-side
 * panel. Reflects the project nearest the scroll orb, or the hovered/focused
 * card. Shows the meaningful data the brief asked for: a cover/mock, product
 * type (industry + category), the outcome narrative, headline result metrics,
 * and the stack — a premium mini case-study card, not a ghost image. The inner
 * content is keyed on the slug so each change cross-fades (instant under RM).
 */
export function ProjectPreview({
  project,
  hasCover,
}: {
  project: Project;
  hasCover: boolean;
}) {
  const results = project.caseStudy.results.slice(0, 2);

  return (
    <div className="surface-card overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div key={project.slug} className="anim-fade">
        {/* Cover / mock */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated">
          {hasCover ? (
            <Image
              src={project.coverImage}
              alt=""
              fill
              sizes="380px"
              className="object-cover"
              {...blurProps(project.coverImage)}
            />
          ) : (
            <div aria-hidden className="size-full" style={{ backgroundImage: PLACEHOLDER_BG }} />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-base via-base/30 to-transparent"
          />
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-line bg-base/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            {project.category}
          </span>
        </div>

        <div className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">
            {project.industry} · {project.year}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight text-ink">
            {project.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
            {project.caseStudy.narrative}
          </p>

          {results.length > 0 && (
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line">
              {results.map((r) => (
                <div key={r.label} className="bg-base p-3.5">
                  <dt className="font-mono text-xl font-semibold tabular-nums leading-none text-ink">
                    {formatStat(r)}
                  </dt>
                  <dd className="mt-1.5 text-[11px] leading-snug text-ink-dim">{r.label}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tech.slice(0, 5).map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>

          <Link
            href={`/work/${project.slug}`}
            className="group mt-6 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ink transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base"
          >
            View case study
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
