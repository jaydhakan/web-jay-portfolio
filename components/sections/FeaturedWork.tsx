import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects, sections } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

/** Asymmetric 60/40 bento: one lead case study, two stacked beside it. */
export function FeaturedWork() {
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const [lead, ...side] = featured;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>{sections.featuredWork.eyebrow}</SectionLabel>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
              {sections.featuredWork.heading}
            </h2>
          </div>
          <Link
            href={sections.featuredWork.viewAll.href}
            className="group inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-accent-primary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          >
            {sections.featuredWork.viewAll.label}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 lg:grid-cols-5">
          <RevealItem className="lg:col-span-3">
            <ProjectCard
              project={lead}
              hasCover={publicImageExists(lead.coverImage)}
              size="featured-large"
            />
          </RevealItem>
          <div className="flex flex-col gap-6 lg:col-span-2">
            {side.map((project) => (
              <RevealItem key={project.slug} className="flex-1">
                <ProjectCard
                  project={project}
                  hasCover={publicImageExists(project.coverImage)}
                  size="featured-small"
                />
              </RevealItem>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
