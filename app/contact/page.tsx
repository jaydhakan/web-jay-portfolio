import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { contact, sections, seo, siteConfig } from "@/data/content";
import { GitHubIcon, LinkedInIcon, UpworkIcon } from "@/components/ui/BrandIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FadeUp } from "@/components/motion/FadeUp";
import { Spotlight } from "@/components/motion/Spotlight";
import { KineticHeadline } from "@/components/ui/KineticHeadline";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: seo.contact.title,
  description: seo.contact.description,
};

const socialLinks = [
  { label: "GitHub", href: siteConfig.githubUrl, Icon: GitHubIcon },
  { label: "LinkedIn", href: siteConfig.linkedinUrl, Icon: LinkedInIcon },
  ...(siteConfig.upworkUrl
    ? [{ label: "Upwork", href: siteConfig.upworkUrl, Icon: UpworkIcon }]
    : []),
];

/* Static page — the ?plan= pre-select is read client-side in ContactForm so this
   route prerenders (no per-request searchParams dynamic render). */
export default function ContactPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left "dark column": ambient spotlight follows the cursor (the
              section's one motion moment). */}
          <Spotlight className="-m-6 rounded-3xl p-6">
            <SectionLabel>{sections.contactPage.eyebrow}</SectionLabel>
            {/* Statement headline — kinetic Syne weight follows the cursor (desktop);
                sr-only text carries the accessible name since the visual is aria-hidden. */}
            <h1 className="mt-4">
              <span className="sr-only">{sections.contactPage.heading}</span>
              <KineticHeadline
                text={sections.contactPage.heading}
                className="block font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl"
              />
            </h1>
            <FadeUp delay={0.1} className="mt-6 max-w-lg text-base leading-relaxed text-ink-dim sm:text-lg">
              {sections.contactPage.subheading}
            </FadeUp>

            <FadeUp delay={0.16}>
              {siteConfig.isAvailable && (
                <p className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ok">
                  <span aria-hidden className="size-2 animate-pulse-dot rounded-full bg-ok" />
                  {contact.availability}
                </p>
              )}

              <ul className="mt-10 space-y-5">
                <li>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="group inline-flex items-center gap-3.5 rounded text-ink-dim transition-colors duration-200 hover:text-ink"
                  >
                    <Mail aria-hidden className="size-5 text-accent" />
                    <span className="text-sm font-medium">{siteConfig.email}</span>
                  </a>
                </li>
                <li className="flex items-center gap-3.5 text-ink-dim">
                  <Clock aria-hidden className="size-5 text-accent" />
                  <span className="text-sm">{contact.responseTime}</span>
                </li>
                <li className="flex items-center gap-3.5 text-ink-dim">
                  <MapPin aria-hidden className="size-5 text-accent" />
                  <span className="text-sm">{contact.location}</span>
                </li>
              </ul>

              <div className="mt-10 flex items-center gap-2">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} profile`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-line text-ink-dim transition-colors duration-200 hover:border-accent/40 hover:text-ink"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                ))}
              </div>
            </FadeUp>
          </Spotlight>

          <ContactForm />
        </div>

        {/* "What happens next" — a genuine ordered flow, so the numbers are earned. */}
        <section className="mt-24 border-t border-line pt-14">
          <FadeUp as="h2" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            What happens next
          </FadeUp>
          <FadeUp as="ol" stagger={0.1} className="mt-10 grid gap-8 sm:grid-cols-3">
            {contact.whatNext.map((step, i) => (
              <li key={step.title}>
                <span aria-hidden className="font-mono text-sm tabular-nums text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{step.desc}</p>
              </li>
            ))}
          </FadeUp>
        </section>
      </div>
    </main>
  );
}
