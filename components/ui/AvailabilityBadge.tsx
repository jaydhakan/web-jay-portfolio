import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/data/content";

/**
 * Rotating circular badge (new_plan 6.4). The ring text spins as a single
 * compositor transform (`animate-spin`), stopped under reduced motion; the
 * solid-accent arrow at the center stays still and nudges on hover. Links to
 * /contact. The ring glyphs are decorative (aria-hidden); the link carries an
 * explicit label. Render only when `siteConfig.isAvailable`.
 */
export function AvailabilityBadge() {
  // Ring text is stretched around the full circle (textLength). It must read as
  // a clean substring of the link's aria-label below, or axe flags
  // label-content-name-mismatch (WCAG 2.5.3) — so no bullets / year here.
  const ring = siteConfig.availabilityNote;

  return (
    <Link
      href="/contact"
      aria-label={`${siteConfig.availabilityNote}. Get in touch.`}
      className="group relative grid size-28 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="size-full animate-[spin_22s_linear_infinite] text-ink-dim motion-reduce:animate-none"
      >
        <defs>
          <path
            id="jd-badge-ring"
            d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"
            fill="none"
          />
        </defs>
        <text
          className="fill-current font-mono uppercase"
          style={{ fontSize: "8.5px", letterSpacing: "0.14em" }}
        >
          <textPath
            href="#jd-badge-ring"
            startOffset="0"
            textLength="232"
            lengthAdjust="spacingAndGlyphs"
          >
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="absolute grid size-9 place-items-center rounded-full bg-accent-solid text-white transition-transform duration-300 ease-out group-hover:scale-110">
        <ArrowUpRight aria-hidden className="size-4" />
      </span>
    </Link>
  );
}
