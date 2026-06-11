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
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
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
    <main id="main-content" className="pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <header className="max-w-2xl">
          <SectionLabel>{sections.servicesPage.eyebrow}</SectionLabel>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-6xl">
            {sections.servicesPage.heading}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-secondary sm:text-lg">
            {sections.servicesPage.subheading}
          </p>
        </header>

        <RevealGroup className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {pricing.map((plan) => (
            <RevealItem key={plan.name} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-surface p-8",
                  plan.highlighted
                    ? "border-2 border-accent-primary bg-elevated"
                    : "border-token",
                )}
              >
                {plan.highlighted && "badge" in plan && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-solid px-3.5 py-1.5 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}
                <h2 className="text-xl font-semibold text-primary">{plan.name}</h2>
                <p className="mt-3 font-display text-3xl font-bold text-primary">{plan.price}</p>
                <p className="mt-2 text-sm text-secondary">{plan.bestFor}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-secondary">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    href={plan.cta.href}
                    variant={plan.highlighted ? "primary" : "ghost"}
                    className="w-full"
                  >
                    {plan.cta.label}
                  </Button>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <section className="py-24">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight text-primary">
              What Each Service Covers
            </h2>
          </Reveal>
          <RevealGroup className="mt-10">
            {services.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <RevealItem key={service.title}>
                  <div className="grid gap-4 border-t border-token py-8 md:grid-cols-[300px_1fr] md:gap-10">
                    <div className="flex items-center gap-3.5">
                      {Icon && <Icon aria-hidden className="size-5 shrink-0 text-accent-primary" />}
                      <h3 className="text-lg font-semibold text-primary">{service.title}</h3>
                    </div>
                    <p className="max-w-2xl leading-relaxed text-secondary">
                      {service.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>
      </div>

      <CTABanner />
    </main>
  );
}
