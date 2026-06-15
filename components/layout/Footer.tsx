import Link from "next/link";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcon";
import { siteConfig, profile } from "@/data/content";

const footerNav = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
] as const;

const iconLinkClasses =
  "inline-flex size-9 items-center justify-center rounded-full text-secondary transition-colors duration-200 " +
  "hover:bg-elevated hover:text-primary focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-token">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-solid text-xs font-bold text-white">
                JD
              </span>
              <span className="text-sm font-semibold text-primary">Jay Dhakan</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              {siteConfig.role}. {profile.location}.
            </p>
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

          <nav aria-label="Footer" className="flex flex-col gap-3">
            {footerNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="w-fit rounded-full text-sm text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-14 border-t border-token pt-6">
          <p className="text-xs text-secondary">
            &copy; {year} Jay Dhakan. Built with Next.js, deployed on Vercel.
          </p>
        </div>
      </div>
    </footer>
  );
}
