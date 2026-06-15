"use client";

import { useRef } from "react";
import { gsap, useGSAP, DUR } from "@/lib/gsap";
import type { TimelineEntry } from "@/data/content";

/**
 * The site's only timeline (D9, catalog #8). A vertical accent spine draws
 * downward as you scroll (scaleY scrubbed, origin top); each node pops and its
 * entry slides in from the spine as the line reaches it. Runtime-set states so
 * no-JS / reduced motion render the full static timeline (R7).
 */
export function ExperienceTimeline({ entries }: { entries: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".tl-spine",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 70%",
              end: "bottom 80%",
              scrub: true,
            },
          },
        );

        gsap.utils.toArray<HTMLElement>(".tl-entry").forEach((el) => {
          const trigger = { trigger: el, start: "top 82%", once: true };
          gsap.from(el.querySelector(".tl-body"), {
            opacity: 0,
            x: -20,
            duration: DUR.std,
            ease: "expo.out",
            scrollTrigger: trigger,
          });
          gsap.from(el.querySelector(".tl-node"), {
            scale: 0.3,
            opacity: 0,
            duration: DUR.micro,
            ease: "expo.out",
            scrollTrigger: trigger,
          });
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative mt-12">
      <div aria-hidden className="absolute bottom-2 left-0 top-2 w-px bg-line">
        <div className="tl-spine size-full origin-top bg-accent" />
      </div>
      <ol className="space-y-12 pl-8">
        {entries.map((entry) => (
          <li key={entry.title} className="tl-entry relative">
            <span
              aria-hidden
              className="tl-node absolute -left-[37.5px] top-1.5 block size-[11px] rounded-full border-2 border-accent bg-base"
            />
            <div className="tl-body">
              <p className="font-mono text-xs tabular-nums text-ink-dim">{entry.period}</p>
              <h3 className="mt-1.5 text-xl font-semibold text-ink">{entry.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">
                {entry.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
