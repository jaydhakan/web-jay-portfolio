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
import { RevealText } from "@/components/motion/RevealText";
import { ClipReveal } from "@/components/motion/ClipReveal";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  MessageSquareText,
  Database,
  Zap,
  Globe,
  Server,
};

/**
 * Services as a hairline-divided grid, not floating cards (avoids the identical
 * card-grid cliche): one cohesive system of cells separated by 1px rules. The
 * cells wipe in left-to-right (catalog #15) — the section's one motion moment —
 * while the heading reveals with the masked-line baseline grammar. No eyebrow:
 * the heading carries the section, keeping the page's eyebrow budget low.
 */
export function Services() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <RevealText
          as="h2"
          className="max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
        >
          {sections.services.heading}
        </RevealText>

        <ClipReveal
          as="ul"
          stagger={0.1}
          className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <li
                key={service.title}
                className="group bg-base p-7 transition-colors duration-300 hover:bg-surface lg:p-8"
              >
                {Icon && (
                  <Icon
                    aria-hidden
                    strokeWidth={1.5}
                    className="size-6 text-accent transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
                  />
                )}
                <h3 className="mt-5 text-lg font-semibold text-ink">{service.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">{service.description}</p>
              </li>
            );
          })}
        </ClipReveal>
      </div>
    </section>
  );
}
