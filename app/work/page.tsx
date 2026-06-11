import type { Metadata } from "next";
import { projects, sections, seo } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WorkGrid } from "@/components/work/WorkGrid";

export const metadata: Metadata = {
  title: seo.work.title,
  description: seo.work.description,
};

export default function WorkPage() {
  const covers = Object.fromEntries(
    projects.map((p) => [p.slug, publicImageExists(p.coverImage)]),
  );

  return (
    <main id="main-content" className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-2xl">
          <SectionLabel>{sections.workPage.eyebrow}</SectionLabel>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-6xl">
            {sections.workPage.heading}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-secondary sm:text-lg">
            {sections.workPage.subheading}
          </p>
        </header>

        <div className="mt-14">
          <WorkGrid projects={projects} covers={covers} filters={sections.workPage.filters} />
        </div>
      </div>
    </main>
  );
}
