import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { projects, sections } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { Tag } from "@/components/ui/Tag";
import { CountUp } from "@/components/ui/CountUp";
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
    <main id="main-content" className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <Link
          href="/work"
          className="group inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
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
                <span className="text-xs text-secondary">{project.year}</span>
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
                {project.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-secondary sm:text-xl">
                {project.description}
              </p>

              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-token py-6 sm:grid-cols-4">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium text-secondary">{item.label}</dt>
                    <dd className="mt-1.5 text-sm font-medium text-primary">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-token">
                {hasCover ? (
                  <Image
                    src={project.coverImage}
                    alt={`${project.title}: ${project.description}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 768px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  // TODO(JAY): drop the real screenshot at public{project.coverImage}
                  <div
                    aria-hidden
                    className="size-full bg-elevated"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse 80% 90% at 70% 20%, color-mix(in oklab, var(--accent-primary) 14%, transparent), transparent 65%)",
                    }}
                  />
                )}
              </div>
            </header>

            <section id="problem" className="scroll-mt-28">
              <h2 className="mt-16 font-display text-2xl font-semibold text-primary">
                {labels.problem}
              </h2>
              {caseStudy.problem.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-secondary">
                  {paragraph}
                </p>
              ))}
            </section>

            <section id="approach" className="scroll-mt-28">
              <h2 className="mt-14 font-display text-2xl font-semibold text-primary">
                {labels.approach}
              </h2>
              {caseStudy.approach.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-secondary">
                  {paragraph}
                </p>
              ))}
            </section>

            <section id="built" className="scroll-mt-28">
              <h2 className="mt-14 font-display text-2xl font-semibold text-primary">
                {labels.built}
              </h2>
              <ul className="mt-6 space-y-4">
                {caseStudy.built.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent-primary" />
                    <span className="leading-relaxed text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {caseStudy.results.length > 0 && (
              <section id="results" className="scroll-mt-28">
                <h2 className="mt-14 font-display text-2xl font-semibold text-primary">
                  {labels.results}
                </h2>
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                  {caseStudy.results.map((stat) => (
                    <div key={stat.label}>
                      <dd className="font-display text-3xl font-bold text-accent-primary sm:text-4xl">
                        <CountUp
                          value={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                          decimals={stat.decimals}
                        />
                      </dd>
                      <dt className="mt-2 text-xs leading-snug text-secondary">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <p className="mt-12 text-lg font-medium leading-relaxed text-primary">
              {caseStudy.narrative}
            </p>

            <nav aria-label="Next project" className="mt-16 border-t border-token pt-8">
              <p className="text-xs font-medium text-secondary">{sections.caseStudy.nextProject}</p>
              <Link
                href={`/work/${next.slug}`}
                className="group mt-2 inline-flex items-center gap-2 rounded font-display text-xl font-semibold text-primary transition-colors duration-200 hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
              >
                {next.title}
                <ArrowRight
                  aria-hidden
                  className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                />
              </Link>
            </nav>
          </article>
        </div>
      </div>
    </main>
  );
}
