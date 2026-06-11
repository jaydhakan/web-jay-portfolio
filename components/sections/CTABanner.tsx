import { sections, siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";

export function CTABanner() {
  const banner = sections.ctaBanner;

  return (
    <section className="relative isolate overflow-hidden border-y border-token py-28">
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-hero opacity-[0.12]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, transparent, var(--bg-base) 90%)",
        }}
      />
      <Reveal className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {banner.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
          {banner.subheading}
        </p>
        <div className="mt-10 flex justify-center">
          <MagneticButton>
            <Button href={banner.cta.href} size="lg" withArrow>
              {banner.cta.label}
            </Button>
          </MagneticButton>
        </div>
        <p className="mt-6 text-sm text-secondary">
          {banner.altContact}{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded font-medium text-accent-primary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          >
            {siteConfig.email}
          </a>
        </p>
      </Reveal>
    </section>
  );
}
