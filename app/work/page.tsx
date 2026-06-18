import type { Metadata } from "next";
import { projects, sections, seo } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrambleHeading } from "@/components/motion/ScrambleHeading";
import { FadeUp } from "@/components/motion/FadeUp";
import { LatentField } from "@/components/three/LatentField";
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
      {/* Page-wide latent field, constellation scene: "your outputs as points in
          latent space" — one tight cluster per project, converging as you scroll
          (E2). The WorkList below stays the interactive + a11y layer (real links);
          poster on mobile/RM. */}
      <LatentField layout="constellation" clusterCount={projects.length} />

      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-3xl">
          <div className="flex items-center gap-4">
            <SectionLabel>{sections.workPage.eyebrow}</SectionLabel>
            <span className="font-mono text-xs tabular-nums text-ink-dim">
              {String(projects.length).padStart(2, "0")} shipped
            </span>
          </div>
          <ScrambleHeading
            as="h1"
            text={sections.workPage.heading}
            className="mt-5 font-display text-5xl font-bold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl"
          />
          <FadeUp delay={0.1} className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
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
