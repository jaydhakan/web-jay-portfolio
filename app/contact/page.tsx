import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { contact, sections, seo, siteConfig } from "@/data/content";
import { GitHubIcon, LinkedInIcon, UpworkIcon } from "@/components/ui/BrandIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: seo.contact.title,
  description: seo.contact.description,
};

type PageProps = { searchParams: Promise<{ plan?: string }> };

/** /contact?plan=growth pre-selects the matching budget range. */
const planToBudget: Record<string, string> = {
  starter: "$1k - $5k",
  growth: "$5k - $15k",
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
          <div>
            <SectionLabel>{sections.contactPage.eyebrow}</SectionLabel>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
              {sections.contactPage.heading}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-secondary sm:text-lg">
              {sections.contactPage.subheading}
            </p>

            {siteConfig.isAvailable && (
              <p className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-token bg-surface px-4 py-2 text-sm font-medium text-success">
                <span aria-hidden className="size-2 animate-pulse-dot rounded-full bg-success" />
                {contact.availability}
              </p>
            )}

            <ul className="mt-10 space-y-5">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="group inline-flex items-center gap-3.5 rounded text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                >
                  <Mail aria-hidden className="size-5 text-accent-primary" />
                  <span className="text-sm font-medium">{siteConfig.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-3.5 text-secondary">
                <Clock aria-hidden className="size-5 text-accent-primary" />
                <span className="text-sm">{contact.responseTime}</span>
              </li>
              <li className="flex items-center gap-3.5 text-secondary">
                <MapPin aria-hidden className="size-5 text-accent-primary" />
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
                  className="inline-flex size-10 items-center justify-center rounded-full border border-token text-secondary transition-colors duration-200 hover:border-accent-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                >
                  <Icon className="size-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <ContactForm defaultBudget={defaultBudget} />
        </div>
      </div>
    </main>
  );
}
