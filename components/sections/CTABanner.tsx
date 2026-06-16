import { sections, siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";

export function CTABanner() {
  const banner = sections.ctaBanner;

  return (
    <section className="relative isolate overflow-hidden border-y border-line py-28">
      {/* Ambient orb pair (catalog #36, plan §4.5) replaces the flat tint. Two
          pre-baked single-hue radials drift on transform only; corner-anchored
          so the central text column stays low-accent and high-contrast. One orb
          on mobile, both static under reduced motion (RM kill-list). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden"
        style={{ background: "var(--base)" }}
      >
        <div
          className="animate-orb-a absolute -left-[12%] -top-[20%] h-[720px] w-[720px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(63% 0.21 272 / 18%) 0%, oklch(63% 0.21 272 / 9%) 38%, transparent 70%)",
          }}
        />
        <div
          className="animate-orb-b absolute -bottom-[24%] -right-[10%] hidden h-[640px] w-[640px] sm:block"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(54% 0.215 272 / 13%) 0%, oklch(54% 0.215 272 / 6%) 40%, transparent 72%)",
          }}
        />
      </div>
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
