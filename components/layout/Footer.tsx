import Link from "next/link";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcon";
import { SlideText } from "@/components/ui/SlideText";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { KineticHeadline } from "@/components/ui/KineticHeadline";
import { siteConfig, profile } from "@/data/content";

const footerNav = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
] as const;

const iconLinkClasses =
  "inline-flex size-9 items-center justify-center rounded-full text-ink-dim transition-colors duration-200 " +
  "hover:bg-elevated hover:text-ink focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-14 border-b border-line pb-12">
          <Link
            href="/contact"
            aria-label={siteConfig.footerCta}
            className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-base"
          >
            <KineticHeadline
              text={siteConfig.footerCta}
              className="block max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-ink transition-colors duration-300 hover:text-accent sm:text-5xl lg:text-6xl"
            />
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-solid text-xs font-bold text-white">
                JD
              </span>
              <span className="text-sm font-semibold text-ink">Jay Dhakan</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-dim">
              {siteConfig.role}. {profile.location}.
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              aria-label={`Email ${siteConfig.email}`}
              className="mt-4 inline-flex items-center py-1.5 font-mono text-sm text-ink-dim transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              <ScrambleText text={siteConfig.email} />
            </a>
            <div className="mt-6 flex items-center gap-1">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className={iconLinkClasses}
              >
                <GitHubIcon className="size-[18px]" />
              </a>
              <a
                href={siteConfig.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className={iconLinkClasses}
              >
                <LinkedInIcon className="size-[18px]" />
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                aria-label={`Email ${siteConfig.email}`}
                className={iconLinkClasses}
              >
                <Mail aria-hidden className="size-[18px]" />
              </a>
            </div>
          </div>

          <div className="flex items-start justify-between gap-10 md:justify-end md:gap-16">
            <nav aria-label="Footer" className="flex flex-col gap-3">
              {footerNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group inline-flex w-fit items-center py-1.5 text-sm text-ink-dim transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                >
                  <SlideText>{link.label}</SlideText>
                </Link>
              ))}
            </nav>
            {siteConfig.isAvailable && <AvailabilityBadge />}
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-6">
          <p className="text-xs text-ink-dim">
            &copy; {year} Jay Dhakan. Built with Next.js, deployed on Vercel.
          </p>
        </div>
      </div>
    </footer>
  );
}
