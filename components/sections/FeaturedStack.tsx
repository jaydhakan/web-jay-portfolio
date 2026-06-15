"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Project } from "@/data/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { Tag } from "@/components/ui/Tag";

const PLACEHOLDER_BG =
  "radial-gradient(ellipse 85% 90% at 70% 25%, oklch(63% 0.21 272 / 0.18), transparent 60%)";

/**
 * The sticky card stack itself (catalog #12). Cards pin at the top in turn and
 * each scales down + dims as the next slides over it (GSAP scrub). Desktop only;
 * mobile is a plain vertical stack (R4). Covers come pre-resolved from the
 * server parent (publicImageExists is fs-only, so it can't run client-side).
 */
export function FeaturedStack({
  featured,
  covers,
}: {
  featured: Project[];
  covers: Record<string, boolean>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;
          gsap.to(card, {
            scale: 0.94,
            opacity: 0.5,
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="mt-12 flex flex-col gap-6">
      {featured.map((project) => {
        const hasCover = covers[project.slug] ?? false;
        return (
          <article
            key={project.slug}
            className="stack-card static will-change-transform md:sticky md:top-28"
          >
            <div className="overflow-hidden rounded-3xl bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]">
              <div className="grid overflow-hidden rounded-[1.125rem] bg-surface ring-1 ring-inset ring-white/[0.04] lg:grid-cols-2">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[24rem]">
                  {hasCover ? (
                    <Image
                      src={project.coverImage}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div aria-hidden className="size-full" style={{ backgroundImage: PLACEHOLDER_BG }} />
                  )}
                </div>

                <div className="flex flex-col p-8 lg:p-10">
                  <div className="flex items-center gap-3">
                    <Tag>{project.industry}</Tag>
                    <span className="text-xs text-ink-dim">{project.year}</span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold text-ink lg:text-3xl">
                    {project.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-ink-dim">{project.description}</p>
                  <div className="mt-auto pt-6">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.slice(0, 4).map((tech) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                    <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-ok">
                      <TrendingUp aria-hidden className="size-4" />
                      {project.result}
                    </p>
                    <Link
                      href={`/work/${project.slug}`}
                      className="group mt-6 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ink transition-colors duration-200 hover:text-accent"
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
