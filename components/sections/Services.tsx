import {
  Bot,
  Database,
  Globe,
  MessageSquareText,
  Server,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { services, sections } from "@/data/content";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  MessageSquareText,
  Database,
  Zap,
  Globe,
  Server,
};

export function Services() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel>{sections.services.eyebrow}</SectionLabel>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
            {sections.services.heading}
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <RevealItem key={service.title} className="h-full">
                <Card className="h-full p-6 lg:p-7">
                  {Icon && <Icon aria-hidden className="size-6 text-accent-primary" />}
                  <h3 className="mt-5 text-xl font-semibold text-primary">{service.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-secondary">
                    {service.description}
                  </p>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
