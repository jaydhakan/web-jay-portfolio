"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { process as processSteps, sections } from "@/data/content";
import { SectionLabel } from "@/components/ui/SectionLabel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * GSAP-only tree (never mixed with Motion). The connector line draws in and
 * steps rise as the section enters. Initial hidden states are set by GSAP at
 * runtime, so no-JS and reduced-motion users get the static layout for free.
 */
export function Process() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean };
          const fill = desktop ? ".process-fill-h" : ".process-fill-v";

          gsap.set(".process-step", { opacity: 0, y: 28 });
          gsap.set(fill, desktop ? { scaleX: 0 } : { scaleY: 0 });

          const tl = gsap.timeline({
            scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
          });
          tl.to(".process-step", {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.12,
          }).to(
            fill,
            desktop
              ? { scaleX: 1, duration: 1.1, ease: "power3.inOut" }
              : { scaleY: 1, duration: 1.1, ease: "power3.inOut" },
            "<0.15",
          );
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>{sections.process.eyebrow}</SectionLabel>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {sections.process.heading}
        </h2>

        <div className="relative mt-16">
          {/* Desktop connector: horizontal track + accent fill. */}
          <div aria-hidden className="absolute inset-x-0 top-0 hidden h-px bg-line lg:block">
            <div className="process-fill-h size-full origin-left bg-accent" />
          </div>
          {/* Mobile connector: vertical, aligned with the dots. */}
          <div aria-hidden className="absolute bottom-2 left-[5px] top-0 block w-px bg-line lg:hidden">
            <div className="process-fill-v size-full origin-top bg-accent" />
          </div>

          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-8">
            {processSteps.map((step) => (
              <li
                key={step.step}
                className="process-step relative isolate pl-8 lg:pl-0 lg:pt-10"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 block size-[11px] rounded-full border-2 border-accent bg-base lg:-top-[5px]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-0 -z-10 select-none font-display text-7xl font-extrabold leading-none text-muted/20 lg:top-6"
                >
                  {step.step}
                </span>
                <h3 className="text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-dim">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
