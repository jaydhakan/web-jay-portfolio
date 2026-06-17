import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { projects, sections } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { blurProps } from "@/lib/blur";
import { FlowImage } from "@/components/media/FlowImage";
import { Tag } from "@/components/ui/Tag";
import { Counter } from "@/components/motion/Counter";
import { RevealText } from "@/components/motion/RevealText";
import { CaseStudySidebar } from "@/components/work/CaseStudySidebar";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const project = projects[index];
  const next = projects[(index + 1) % projects.length];
  const { caseStudy } = project;
  const hasCover = publicImageExists(project.coverImage);
  const nextHasCover = publicImageExists(next.coverImage);

  const labels = sections.caseStudy.sections;
  const sidebarItems = [
    { id: "problem", label: labels.problem },
    { id: "approach", label: labels.approach },
    { id: "built", label: labels.built },
    ...(caseStudy.results.length > 0 ? [{ id: "results", label: labels.results }] : []),
  ];

  const meta = [
    { label: "Client", value: project.client },
    { label: "Timeline", value: caseStudy.timeline },
    { label: "My Role", value: caseStudy.role },
    { label: "Category", value: project.category },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <Link
          href="/work"
          className="group inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-ink-dim transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          <ArrowLeft
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          />
          {sections.caseStudy.backLabel}
        </Link>

        <div className="mt-10 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <CaseStudySidebar title={project.title} items={sidebarItems} />
            </div>
          </aside>

          <article className="max-w-3xl">
            <header>
              <div className="flex items-center gap-3">
                <Tag>{project.industry}</Tag>
                <span className="text-xs text-ink-dim">{project.year}</span>
              </div>
              <RevealText
                as="h1"
                className="mt-5 font-display text-4xl font-bold tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl"
              >
                {project.title}
              </RevealText>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-dim sm:text-xl">
                {project.description}
              </p>

              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-4">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium text-ink-dim">{item.label}</dt>
                    <dd className="mt-1.5 text-sm font-medium text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Cinematic cover hero — duotone overlay + subtle scale on hover
                  (ken-burns proper lands in P11); grain is global. */}
              <div className="group relative mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-line">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-base/50 via-transparent to-accent/10"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 opacity-60 [box-shadow:inset_0_0_80px_-20px_var(--color-base)]"
                />
                {hasCover ? (
                  <FlowImage
                    src={project.coverImage}
                    alt={`${project.title}: ${project.description}`}
                    priority
                    sizes="(min-width: 1024px) 768px, 100vw"
                    imageClassName="ken-burns"
                  />
                ) : (
                  // TODO(JAY): drop the real screenshot at public{project.coverImage}
                  <div
                    aria-hidden
                    className="size-full bg-elevated"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse 80% 90% at 70% 20%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)",
                    }}
                  />
                )}
              </div>
            </header>

            <section id="problem" className="scroll-mt-28">
              <h2 className="mt-16 font-display text-2xl font-semibold text-ink">
                {labels.problem}
              </h2>
              {caseStudy.problem.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </section>

            <section id="approach" className="scroll-mt-28">
              <h2 className="mt-14 font-display text-2xl font-semibold text-ink">
                {labels.approach}
              </h2>
              {caseStudy.approach.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </section>

            <section id="built" className="scroll-mt-28">
              <h2 className="mt-14 font-display text-2xl font-semibold text-ink">
                {labels.built}
              </h2>
              <ul className="mt-6 space-y-4">
                {caseStudy.built.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                    <span className="leading-relaxed text-ink-dim">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {caseStudy.results.length > 0 && (
              <section id="results" className="scroll-mt-28">
                <h2 className="mt-14 font-display text-2xl font-semibold text-ink">
                  {labels.results}
                </h2>
                <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                  {caseStudy.results.map((stat) => (
                    <div key={stat.label}>
                      <dd className="font-mono text-[clamp(2.5rem,6vw,3.75rem)] font-semibold leading-none tracking-tight text-accent">
                        <Counter
                          value={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                          decimals={stat.decimals}
                        />
                      </dd>
                      <dt className="mt-3 text-sm leading-snug text-ink-dim">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <p className="mt-12 text-lg font-medium leading-relaxed text-ink">
              {caseStudy.narrative}
            </p>

            {/* Bold next-project card — chains case studies cinematically. */}
            <nav aria-label="Next project" className="mt-20 border-t border-line pt-10">
              <Link
                href={`/work/${next.slug}`}
                className="group flex items-center gap-6 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base"
              >
                <div className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:w-44">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-base/40 to-transparent"
                  />
                  {nextHasCover ? (
                    <Image
                      src={next.coverImage}
                      alt=""
                      fill
                      sizes="176px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      {...blurProps(next.coverImage)}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="size-full bg-elevated"
                      style={{
                        backgroundImage:
                          "radial-gradient(ellipse 80% 90% at 70% 20%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)",
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
                    {sections.caseStudy.nextProject}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink transition-colors duration-200 group-hover:text-accent sm:text-3xl">
                    {next.title}
                  </h2>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-dim">
                    View case study
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </nav>
          </article>
        </div>
      </div>
    </main>
  );
}
