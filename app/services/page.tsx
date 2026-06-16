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
import { FadeUp } from "@/components/motion/FadeUp";
import { ClipReveal } from "@/components/motion/ClipReveal";
import { LineDraw } from "@/components/motion/LineDraw";
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
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-2xl">
          <SectionLabel>{sections.servicesPage.eyebrow}</SectionLabel>
          <RevealText
            as="h1"
            className="mt-4 font-display text-4xl font-bold tracking-tight text-ink md:text-6xl"
          >
            {sections.servicesPage.heading}
          </RevealText>
          <FadeUp delay={0.1} className="mt-5 text-base leading-relaxed text-ink-dim sm:text-lg">
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
            className="font-display text-4xl font-bold tracking-tight text-ink"
          >
            {sections.servicesPage.coverageHeading}
          </RevealText>
          <FadeUp as="ul" stagger={0.08} className="mt-10">
            {services.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <li
                  key={service.title}
                  className="grid gap-4 border-t border-line py-8 md:grid-cols-[300px_1fr] md:gap-10"
                >
                  <div className="flex items-center gap-3.5">
                    {Icon && (
                      <Icon aria-hidden strokeWidth={1.5} className="size-5 shrink-0 text-accent" />
                    )}
                    <h3 className="text-lg font-semibold text-ink">{service.title}</h3>
                  </div>
                  <p className="max-w-2xl leading-relaxed text-ink-dim">{service.description}</p>
                </li>
              );
            })}
          </FadeUp>
        </section>
      </div>

      <CTABanner />
    </main>
  );
}
