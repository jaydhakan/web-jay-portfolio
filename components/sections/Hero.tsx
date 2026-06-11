import { hero, siteConfig } from "@/data/content";
import { AnimatedText } from "@/components/ui/AnimatedText";
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
            className="anim-rise flex items-center gap-2.5 text-sm font-medium text-success"
            style={{ animationDelay: "0.05s" }}
          >
            <span aria-hidden className="size-2 animate-pulse-dot rounded-full bg-success" />
            {siteConfig.availabilityNote}
          </p>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.08] tracking-tight text-primary sm:text-6xl lg:text-7xl">
            <span className="sr-only">
              {hero.h1Line1} {hero.h1Line2}
            </span>
            <span aria-hidden className="block">
              <AnimatedText text={hero.h1Line1} delay={0.15} stagger={0.022} />
            </span>
            <span aria-hidden className="block">
              <AnimatedText text={hero.h1Line2} delay={0.45} stagger={0.022} />
            </span>
          </h1>

          <p
            className="anim-rise mt-6 max-w-lg text-base leading-relaxed text-secondary sm:text-lg"
            style={{ animationDelay: "0.75s" }}
          >
            {hero.subheading}
          </p>

          <div
            className="anim-rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.9s" }}
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
