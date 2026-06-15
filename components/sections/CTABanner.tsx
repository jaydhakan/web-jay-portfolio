import { sections, siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";

export function CTABanner() {
  const banner = sections.ctaBanner;

  return (
    <section className="relative isolate overflow-hidden border-y border-line py-28">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, oklch(63% 0.21 272 / 14%), transparent 70%), var(--base)",
        }}
      />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <RevealText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
        >
          {banner.heading}
        </RevealText>
        <FadeUp delay={0.1} className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
          {banner.subheading}
        </FadeUp>
        <FadeUp delay={0.18} className="mt-10 flex justify-center">
          <MagneticButton>
            <Button href={banner.cta.href} size="lg" withArrow>
              {banner.cta.label}
            </Button>
          </MagneticButton>
        </FadeUp>
        <FadeUp delay={0.24} className="mt-6 text-sm text-ink-dim">
          {banner.altContact}{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded font-medium text-accent transition-colors duration-200 hover:text-ink"
          >
            {siteConfig.email}
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
