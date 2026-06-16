import { hero, siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HeroBackground } from "@/components/sections/HeroBackground";

/**
 * Left-aligned full-viewport hero (DESIGN.md: never centered). Exactly four
 * text elements: availability badge, two-line H1, subheading, CTA pair.
 * All copy is server-rendered with CSS entrance choreography; the only
 * client islands are the shader background and the magnetic CTA wrapper.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100dvh] items-center overflow-hidden">
      <div aria-hidden className="hero-fallback absolute inset-0 -z-20" />
      <HeroBackground />

      <div className="mx-auto w-full max-w-7xl px-6 pt-16">
        <div className="max-w-3xl">
          <p
            data-hero-rise
            className="anim-rise flex items-center gap-2.5 text-sm font-medium text-ok"
            style={{ animationDelay: "0.05s" }}
          >
            <span aria-hidden className="size-2 animate-pulse-dot rounded-full bg-ok" />
            {siteConfig.availabilityNote}
          </p>

          {/* H1 ships server-rendered at opacity:1 in final position -- it is the
              LCP element (non-negotiable / D-9). The desktop opening only animates
              the inner [data-hero-line] spans (a masked-line rise inside
              overflow-hidden), and only AFTER first paint while covered by the
              preloader, so the H1's opacity:1 paint still registers first. No-JS /
              reduced-motion / mobile / repeat visit leave the lines at rest =
              fully visible. */}
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            <span className="sr-only">
              {hero.h1Line1} {hero.h1Line2}
            </span>
            <span aria-hidden className="block overflow-hidden pb-[0.12em]">
              <span data-hero-line className="block">{hero.h1Line1}</span>
            </span>
            <span aria-hidden className="block overflow-hidden pb-[0.12em]">
              <span data-hero-line className="block">{hero.h1Line2}</span>
            </span>
          </h1>

          <p
            data-hero-rise
            className="anim-rise mt-6 max-w-lg text-base leading-relaxed text-ink-dim sm:text-lg"
            style={{ animationDelay: "0.4s" }}
          >
            {hero.subheading}
          </p>

          <div
            data-hero-rise
            className="anim-rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.55s" }}
          >
            <MagneticButton>
              <Button href={hero.ctaPrimary.href} size="lg">
                {hero.ctaPrimary.label}
              </Button>
            </MagneticButton>
            <Button href={hero.ctaSecondary.href} variant="ghost" size="lg" withArrow>
              {hero.ctaSecondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
