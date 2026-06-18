import type { Metadata } from "next";
import {
  Bot,
  Check,
  Database,
  Globe,
  MessageSquareText,
  Server,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { pricing, sections, seo, services } from "@/data/content";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { RevealText } from "@/components/motion/RevealText";
import { ScrambleHeading } from "@/components/motion/ScrambleHeading";
import { FadeUp } from "@/components/motion/FadeUp";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { LineDraw } from "@/components/motion/LineDraw";
import { LatentField } from "@/components/three/LatentField";
import { ServiceMotif } from "@/components/sections/ServiceMotif";
import { CTABanner } from "@/components/sections/CTABanner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: seo.services.title,
  description: seo.services.description,
};

const iconMap: Record<string, LucideIcon> = {
  Bot,
  MessageSquareText,
  Database,
  Zap,
  Globe,
  Server,
};

export default function ServicesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="pt-32">
      {/* Quiet page-wide field echo (E4) so /services speaks the same latent-space
          language as home/about/work. Mostly ambient behind the opaque cards; one
          governed canvas, poster on mobile/RM. (/contact keeps its particle finale
          instead — never a 2nd live canvas on a route.) Lighter count: ambient echo
          mostly behind the opaque cards, so it needn't run the full particle budget. */}
      <LatentField count={6000} />

      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-3xl">
          <SectionLabel>{sections.servicesPage.eyebrow}</SectionLabel>
          <ScrambleHeading
            as="h1"
            text={sections.servicesPage.heading}
            className="mt-4 font-display text-5xl font-bold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl"
          />
          <FadeUp delay={0.1} className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
            {sections.servicesPage.subheading}
          </FadeUp>
        </header>

        <ClipReveal
          as="ul"
          stagger={0.12}
          className="mt-16 grid items-start gap-6 lg:grid-cols-3"
        >
          {pricing.map((plan) => {
            const highlighted = plan.highlighted;
            return (
              <li key={plan.name} className="h-full">
                {/* Double-bezel (plan reserves the full bezel for pricing). The
                    highlighted tier gets an accent shell + the concentric-arc
                    "growth ring" echo of The Field, drawn on scroll entry. */}
                <div
                  className={cn(
                    "h-full rounded-3xl p-1.5 ring-1",
                    highlighted
                      ? "bg-accent/[0.07] ring-accent/40"
                      : "bg-white/[0.02] ring-white/[0.06]",
                  )}
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[1.125rem] bg-surface p-8 ring-1 ring-inset ring-white/[0.04]">
                    {highlighted && (
                      <LineDraw
                        viewBox="0 0 96 96"
                        className="pointer-events-none absolute right-0 top-0 size-32 text-accent/35"
                      >
                        <circle data-draw cx="96" cy="0" r="26" stroke="currentColor" strokeWidth="1" fill="none" />
                        <circle data-draw cx="96" cy="0" r="46" stroke="currentColor" strokeWidth="1" fill="none" />
                        <circle data-draw cx="96" cy="0" r="66" stroke="currentColor" strokeWidth="1" fill="none" />
                      </LineDraw>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
                      {highlighted && "badge" in plan && (
                        <span className="rounded-full bg-accent-solid px-3 py-1 text-xs font-semibold text-white">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-ink">{plan.price}</p>
                    <p className="mt-2 text-sm text-ink-dim">{plan.bestFor}</p>
                    <ul className="mt-7 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-ink-dim">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Button
                        href={plan.cta.href}
                        variant={highlighted ? "primary" : "ghost"}
                        className="w-full"
                      >
                        {plan.cta.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ClipReveal>

        <section className="py-24">
          <RevealText
            as="h2"
            className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
          >
            {sections.servicesPage.coverageHeading}
          </RevealText>

          {/* Bento 2.0 (P7): a deliberately varied tile grid — a wide feature
              tile + a wide footer tile + standard tiles — with neon-accent
              tactile hover (lift + accent ring + glowing icon chip). */}
          <ClipReveal
            as="ul"
            stagger={0.09}
            className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service, i) => {
              const Icon = iconMap[service.icon];
              // First tile spans two columns (feature); last spans the full row.
              const span = i === 0 ? "sm:col-span-2" : i === services.length - 1 ? "sm:col-span-2 lg:col-span-3" : "";
              return (
                <li
                  key={service.title}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-[1.25rem] bg-surface p-7 ring-1 ring-white/[0.06] transition duration-300 ease-out",
                    "hover:-translate-y-1 hover:bg-elevated hover:ring-accent/30 active:scale-[0.99]",
                    span,
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent"
                  />
                  {/* Always-on computational motif (V3 P12) — the tile reads as a
                      live system, not a static card. Cheap SVG/CSS, RM-safe. */}
                  <ServiceMotif icon={service.icon} />
                  {Icon && (
                    <span className="relative grid size-11 place-items-center rounded-xl bg-accent/10 ring-1 ring-accent/15 transition-colors duration-300 group-hover:bg-accent/20 group-hover:ring-accent/30">
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-xl bg-accent opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-30"
                      />
                      <Icon aria-hidden strokeWidth={1.5} className="relative size-5 text-accent" />
                    </span>
                  )}
                  <h3 className="relative mt-5 font-display text-lg font-semibold text-ink">{service.title}</h3>
                  <p className="relative mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-dim">{service.description}</p>
                </li>
              );
            })}
          </ClipReveal>
        </section>
      </div>

      <CTABanner />
    </main>
  );
}
