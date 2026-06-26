import { hero, siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HeroHeadlineKinetic } from "@/components/sections/HeroHeadlineKinetic";
import { HeroVisual } from "@/components/sections/HeroVisual";

/**
 * Left-aligned full-viewport hero (DESIGN.md: never centered). Two-column on xl+:
 * the copy column (availability badge, two-line H1, subheading, CTA pair, and a
 * credibility proof strip) balanced by the "live system" console on the right so
 * the wide-desktop fold no longer reads as empty. Below xl it collapses to the
 * single copy column (the proof strip stays — strong mobile proof — but the heavy
 * decorative console is dropped to keep mobile fast + uncrowded).
 *
 * All copy is server-rendered with CSS entrance choreography; the only client
 * islands remain the shader backdrop and the magnetic CTA wrapper. The console is
 * a server component (no canvas). Elements carry both `data-hero-rise` (the
 * desktop GSAP opening) and `.anim-rise` (the CSS entrance everywhere else).
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100dvh] items-center overflow-hidden">
      {/* Backdrop is the page-wide LatentField (mounted in app/page.tsx) showing
          through this transparent section — the loss-landscape hero is retired on
          home (HeroBackground / HeroShader kept in the repo for reuse). */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-16">
        <div className="hero-parallax grid items-center gap-x-12 gap-y-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="max-w-2xl xl:max-w-none">
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
            <h1 className="mt-6 font-display text-[clamp(2.75rem,8vw,4.9rem)] font-bold leading-[1.04] tracking-[-0.03em] text-ink">
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
            <HeroHeadlineKinetic />

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

            {/* Credibility proof — visible on every breakpoint (the console is xl+
                only, so this carries the proof on mobile/tablet). */}
            <ul
              data-hero-rise
              className="anim-rise mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-4"
              style={{ animationDelay: "0.7s" }}
            >
              {hero.proof.map((metric) => (
                <li key={metric.label}>
                  <p className="font-mono text-[1.6rem] font-semibold leading-none tracking-tight tabular-nums text-ink">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-snug text-ink-dim">{metric.label}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right-side "live system" console — wide-desktop only (xl+). */}
          <div
            data-hero-rise
            className="anim-rise hidden justify-self-end xl:flex"
            style={{ animationDelay: "0.5s" }}
          >
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
