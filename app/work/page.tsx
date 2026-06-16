import type { Metadata } from "next";
import { projects, sections, seo } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";
import { WorkList } from "@/components/work/WorkList";

export const metadata: Metadata = {
  title: seo.work.title,
  description: seo.work.description,
};

export default function WorkPage() {
  const covers = Object.fromEntries(
    projects.map((p) => [p.slug, publicImageExists(p.coverImage)]),
  );

  return (
    <main id="main-content" tabIndex={-1} className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-2xl">
          <SectionLabel>{sections.workPage.eyebrow}</SectionLabel>
          <RevealText
            as="h1"
            className="mt-4 font-display text-4xl font-bold tracking-tight text-ink md:text-6xl"
          >
            {sections.workPage.heading}
          </RevealText>
          <FadeUp delay={0.1} className="mt-5 text-base leading-relaxed text-ink-dim sm:text-lg">
            {sections.workPage.subheading}
          </FadeUp>
        </header>

        <div className="mt-14">
          <WorkList projects={projects} covers={covers} filters={sections.workPage.filters} />
        </div>
      </div>
    </main>
  );
}
