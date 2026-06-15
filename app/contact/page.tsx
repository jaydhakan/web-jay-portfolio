import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { contact, sections, seo, siteConfig } from "@/data/content";
import { GitHubIcon, LinkedInIcon, UpworkIcon } from "@/components/ui/BrandIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";
import { Spotlight } from "@/components/motion/Spotlight";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: seo.contact.title,
  description: seo.contact.description,
};

type PageProps = { searchParams: Promise<{ plan?: string }> };

/** /contact?plan=growth pre-selects the matching budget range. */
const planToBudget: Record<string, string> = {
  starter: "$1k-$5k",
  growth: "$5k-$15k",
  custom: "Let's discuss",
};

const socialLinks = [
  { label: "GitHub", href: siteConfig.githubUrl, Icon: GitHubIcon },
  { label: "LinkedIn", href: siteConfig.linkedinUrl, Icon: LinkedInIcon },
  ...(siteConfig.upworkUrl
    ? [{ label: "Upwork", href: siteConfig.upworkUrl, Icon: UpworkIcon }]
    : []),
];

export default async function ContactPage({ searchParams }: PageProps) {
  const { plan } = await searchParams;
  const defaultBudget = plan ? planToBudget[plan] : undefined;

  return (
    <main id="main-content" className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left "dark column": ambient spotlight follows the cursor (the
              section's one motion moment). */}
          <Spotlight className="-m-6 rounded-3xl p-6">
            <SectionLabel>{sections.contactPage.eyebrow}</SectionLabel>
            <RevealText
              as="h1"
              className="mt-4 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
            >
              {sections.contactPage.heading}
            </RevealText>
            <FadeUp delay={0.1} className="mt-5 max-w-lg text-base leading-relaxed text-ink-dim sm:text-lg">
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

          <ContactForm defaultBudget={defaultBudget} />
        </div>
      </div>
    </main>
  );
}
