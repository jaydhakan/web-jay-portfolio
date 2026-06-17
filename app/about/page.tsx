import type { Metadata } from "next";
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
import { RevealText } from "@/components/motion/RevealText";
import { ScrambleHeading } from "@/components/motion/ScrambleHeading";
import { Teleprompter } from "@/components/motion/Teleprompter";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { LineDraw } from "@/components/motion/LineDraw";
import { ExperienceTimeline } from "@/components/sections/ExperienceTimeline";
import { SkillBag } from "@/components/about/SkillBag";
import { ParticlePortrait } from "@/components/about/ParticlePortrait";
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
    <main id="main-content" tabIndex={-1} className="pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-3xl">
          <SectionLabel>{sections.aboutPage.eyebrow}</SectionLabel>
          <ScrambleHeading
            as="h1"
            text={sections.aboutPage.heading}
            className="mt-4 font-display text-5xl font-bold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl"
          />
        </header>

        {/* Identity row — "you, as data" particle portrait (V3 P9 / S7): the
            headshot assembles from a GPU point cloud, breathes, and scatters to
            a sphere then reforms on hover. Plain photo poster under mobile /
            reduced motion / no-JS / no-WebGL (and it is the SSR + a11y layer). */}
        <div className="mt-14 flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="group relative aspect-square w-40 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line transition duration-300 ease-out hover:ring-accent/40 sm:w-48">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-accent/25 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-0"
            />
            {hasPhoto ? (
              // TODO(JAY): the particle cloud samples this file's luminance as
              // pseudo-depth; drop a real 400x400+ photo (+ optional offline
              // depth map) at public/images/profile/jay.jpg and it upgrades.
              <ParticlePortrait
                src={profile.photo}
                alt={`Portrait of ${profile.name}`}
                sizes="192px"
              />
            ) : (
              // TODO(JAY): drop a 400x400+ photo at public/images/profile/jay.jpg
              <div className="flex size-full items-center justify-center bg-elevated">
                <span className="font-display text-4xl font-bold text-accent">JD</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-ink">{profile.name}</h2>
            <p className="mt-1 text-sm text-ink-dim">
              {profile.role}, {profile.location}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-dim">
              {siteConfig.tagline}
            </p>
          </div>
        </div>

        {/* Teleprompter bio statement */}
        <Teleprompter className="mt-14 max-w-4xl font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
          {profile.bio}
        </Teleprompter>

        {/* Contour divider — the D4 SVG line-draw moment (echo of The Field) */}
        <div className="my-20 flex items-center gap-5">
          <span aria-hidden className="h-px flex-1 bg-line" />
          <LineDraw viewBox="0 0 48 48" scrub className="size-11 shrink-0 text-accent">
            <circle data-draw cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle data-draw cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.25" fill="none" />
            <circle data-draw cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" fill="none" />
          </LineDraw>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>

        {/* Toolkit — throwable skill bag (V3 P8 / S11): grab, fling, self-heal.
            Plain wrap grid under mobile / touch / reduced motion / no-JS. */}
        <section className="pb-24">
          <RevealText as="h2" className="font-display text-4xl font-bold tracking-tight text-ink">
            What I Work With
          </RevealText>
          <SkillBag toolkit={profile.toolkit} />
        </section>

        {/* Experience timeline (the only timeline on the site) */}
        <section className="pb-24">
          <SectionLabel>{sections.aboutPage.storyEyebrow}</SectionLabel>
          <RevealText
            as="h2"
            className="mt-3 font-display text-4xl font-bold tracking-tight text-ink"
          >
            The Short Version
          </RevealText>
          <ExperienceTimeline entries={timeline} />
        </section>

        {/* How I Work — staggered left-wipe reveal + hover treatment */}
        <section className="pb-24">
          <RevealText
            as="h2"
            className="font-display text-4xl font-bold tracking-tight text-ink"
          >
            How I Work
          </RevealText>
          <ClipReveal as="ul" stagger={0.12} className="mt-12 grid gap-10 md:grid-cols-3">
            {howIWork.map((value) => {
              const Icon = howIconMap[value.icon];
              return (
                <li key={value.title} className="group">
                  {Icon && (
                    <Icon
                      aria-hidden
                      strokeWidth={1.5}
                      className="size-6 text-accent transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
                    />
                  )}
                  <h3 className="mt-4 text-lg font-semibold text-ink transition-[letter-spacing] duration-300 ease-out group-hover:tracking-wide">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{value.description}</p>
                </li>
              );
            })}
          </ClipReveal>
        </section>

        <section className="border-t border-line py-14">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="text-sm font-semibold text-ink">{sections.aboutPage.platformsLabel}</p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} profile`}
                  className="inline-flex size-10 items-center justify-center rounded-full text-ink-dim transition-colors duration-200 hover:bg-elevated hover:text-ink"
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
