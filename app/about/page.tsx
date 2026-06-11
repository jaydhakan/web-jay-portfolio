import type { Metadata } from "next";
import Image from "next/image";
import {
  MessagesSquare,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { howIWork, profile, sections, seo, siteConfig, timeline } from "@/data/content";
import { publicImageExists } from "@/lib/images";
import { GitHubIcon, LinkedInIcon, UpworkIcon } from "@/components/ui/BrandIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { CTABanner } from "@/components/sections/CTABanner";

export const metadata: Metadata = {
  title: seo.about.title,
  description: seo.about.description,
};

const howIconMap: Record<string, LucideIcon> = {
  MessagesSquare,
  ShieldCheck,
  Rocket,
};

const socialLinks = [
  { label: "GitHub", href: siteConfig.githubUrl, Icon: GitHubIcon },
  { label: "LinkedIn", href: siteConfig.linkedinUrl, Icon: LinkedInIcon },
  ...(siteConfig.upworkUrl
    ? [{ label: "Upwork", href: siteConfig.upworkUrl, Icon: UpworkIcon }]
    : []),
];

export default function AboutPage() {
  const hasPhoto = publicImageExists(profile.photo);

  return (
    <main id="main-content" className="pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-2xl">
          <SectionLabel>{sections.aboutPage.eyebrow}</SectionLabel>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-6xl">
            {sections.aboutPage.heading}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-secondary sm:text-lg">
            {sections.aboutPage.subheading}
          </p>
        </header>

        <Reveal className="mt-14">
          <Card interactive={false} className="p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="relative size-32 shrink-0 overflow-hidden rounded-full ring-2 ring-accent-primary ring-offset-4 ring-offset-surface md:size-40">
                {hasPhoto ? (
                  <Image
                    src={profile.photo}
                    alt={`Portrait of ${profile.name}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  // TODO(JAY): drop a 400x400+ photo at public/images/profile/jay.jpg
                  <div className="flex size-full items-center justify-center bg-elevated">
                    <span className="font-display text-3xl font-bold text-accent-primary">
                      JD
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-3xl font-bold text-primary">{profile.name}</h2>
                <p className="mt-1.5 text-sm text-secondary">
                  {profile.role} · {profile.location}
                </p>
                <p className="mt-5 max-w-2xl leading-relaxed text-secondary">{profile.bio}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        <section className="py-24">
          <SectionLabel>{sections.aboutPage.storyEyebrow}</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary">
            The Short Version
          </h2>
          <RevealGroup className="mt-12">
            <ol className="relative space-y-12 border-l border-token pl-8">
              {timeline.map((entry) => (
                <RevealItem key={entry.title} className="relative">
                  <li>
                    <span
                      aria-hidden
                      className="absolute -left-[37.5px] top-1.5 block size-[11px] rounded-full border-2 border-accent-primary bg-base"
                    />
                    <p className="text-sm font-medium tabular-nums text-muted">{entry.period}</p>
                    <h3 className="mt-1.5 text-xl font-semibold text-primary">{entry.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">
                      {entry.description}
                    </p>
                  </li>
                </RevealItem>
              ))}
            </ol>
          </RevealGroup>
        </section>

        <section className="pb-24">
          <h2 className="font-display text-4xl font-bold tracking-tight text-primary">
            How I Work
          </h2>
          <RevealGroup className="mt-12 grid gap-10 md:grid-cols-3">
            {howIWork.map((value) => {
              const Icon = howIconMap[value.icon];
              return (
                <RevealItem key={value.title}>
                  {Icon && <Icon aria-hidden className="size-6 text-accent-primary" />}
                  <h3 className="mt-4 text-lg font-semibold text-primary">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    {value.description}
                  </p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>

        <section className="border-t border-token py-14">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="text-sm font-semibold text-primary">
              {sections.aboutPage.platformsLabel}
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} profile`}
                  className="inline-flex size-10 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-elevated hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <CTABanner />
    </main>
  );
}
