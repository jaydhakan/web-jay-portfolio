import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects, sections } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeaturedStack } from "@/components/sections/FeaturedStack";

/**
 * Featured work header + the sticky card stack (catalog #12, D8 #1). Stays a
 * server component so it can resolve covers via publicImageExists (fs-only);
 * the GSAP sticky-stack lives in the FeaturedStack client leaf.
 */
export function FeaturedWork() {
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const covers = Object.fromEntries(
    featured.map((p) => [p.slug, publicImageExists(p.coverImage)]),
  );

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>{sections.featuredWork.eyebrow}</SectionLabel>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              {sections.featuredWork.heading}
            </h2>
          </div>
          <Link
            href={sections.featuredWork.viewAll.href}
            className="group inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-accent transition-colors duration-200 hover:text-ink"
          >
            {sections.featuredWork.viewAll.label}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <FeaturedStack featured={featured} covers={covers} />
      </div>
    </section>
  );
}
