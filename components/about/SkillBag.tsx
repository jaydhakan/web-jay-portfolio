"use client";

import { useRef } from "react";
import { gsap, useGSAP, useExtraPlugins, getDraggable, getFlip } from "@/lib/gsap";
import { Tag } from "@/components/ui/Tag";

type ToolkitGroup = { group: string; items: string[] };

/**
 * Throwable skill bag (V3 P8 / S11) — the /about toolkit, made tactile. Each
 * category card is a physics "bag": grab a chip, fling it, watch it settle with
 * momentum (GSAP Draggable + InertiaPlugin), bounded to the card. When the bag
 * goes idle (or you hit "tidy up"), the chips SELF-HEAL back to their grid
 * positions via Flip. Desktop + fine-pointer + motion only; everything else
 * (mobile, touch, reduced motion, no-JS) renders the same chips as a plain
 * wrap grid — the chips are always real text, so a11y is unchanged.
 *
 * Pure enhancement of the existing markup: the chips ship in flow and are only
 * upgraded to draggable after the lazy GSAP physics plugins load.
 */
export function SkillBag({ toolkit }: { toolkit: ToolkitGroup[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ready = useExtraPlugins(); // kicks the lazy Draggable/Inertia/Flip load

  useGSAP(
    () => {
      if (!ready) return;
      const Draggable = getDraggable();
      const Flip = getFlip();
      const root = rootRef.current;
      if (!Draggable || !Flip || !root) return;

      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const bags = gsap.utils.toArray<HTMLElement>(".skill-bag", root);
          const draggables: InstanceType<NonNullable<typeof Draggable>>[] = [];
          const idleTimers = new Map<HTMLElement, number>();

          bags.forEach((bag) => {
            const chips = gsap.utils.toArray<HTMLElement>(".skill-chip", bag);

            // Self-heal: record current flowed positions, clear transforms, Flip
            // each chip back home from wherever it was flung.
            const tidy = () => {
              const state = Flip.getState(chips);
              chips.forEach((c) => gsap.set(c, { x: 0, y: 0, rotation: 0 }));
              Flip.from(state, {
                duration: 0.7,
                ease: "elastic.out(1, 0.7)",
                stagger: 0.03,
              });
            };

            const scheduleTidy = (chip: HTMLElement) => {
              const prev = idleTimers.get(chip);
              if (prev) window.clearTimeout(prev);
              // Each bag tidies itself a few seconds after the last throw settles.
              idleTimers.set(
                chip,
                window.setTimeout(tidy, 2600),
              );
            };

            chips.forEach((chip) => {
              const d = Draggable.create(chip, {
                type: "x,y",
                bounds: bag,
                inertia: true,
                edgeResistance: 0.72,
                dragResistance: 0.05,
                onPress() {
                  gsap.to(chip, { scale: 1.12, duration: 0.18, ease: "back.out(2)", zIndex: 30, overwrite: "auto" });
                  const t = idleTimers.get(chip);
                  if (t) window.clearTimeout(t);
                },
                onDrag() {
                  // Lean into the throw — rotate toward horizontal velocity.
                  gsap.set(chip, { rotation: gsap.utils.clamp(-22, 22, this.deltaX * 0.6) });
                },
                onRelease() {
                  gsap.to(chip, { scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
                },
                onThrowComplete() {
                  gsap.to(chip, { rotation: 0, duration: 0.4, ease: "power2.out" });
                  scheduleTidy(chip);
                },
              })[0];
              draggables.push(d);
            });
          });

          return () => {
            for (const t of idleTimers.values()) window.clearTimeout(t);
            idleTimers.clear();
            draggables.forEach((d) => d.kill());
          };
        },
      );
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <div ref={rootRef} className="mt-12 grid gap-3 sm:grid-cols-2">
      {toolkit.map((group) => (
        <div
          key={group.group}
          className="skill-bag group relative overflow-hidden rounded-[1.25rem] bg-surface p-7 ring-1 ring-white/[0.06] transition duration-300 ease-out hover:bg-elevated hover:ring-accent/30"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{group.group}</h3>
            <span className="font-mono text-xs tabular-nums text-ink-dim">
              {String(group.items.length).padStart(2, "0")}
            </span>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Tag
                key={item}
                className="skill-chip cursor-grab touch-none select-none bg-elevated ring-1 ring-white/[0.04] transition-colors duration-200 hover:text-ink active:cursor-grabbing"
              >
                {item}
              </Tag>
            ))}
          </div>
          {/* Hint, desktop + motion only (CSS-gated; appears once the bag is interactive). */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-4 right-6 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim/80 transition-colors duration-300 group-hover:text-ink-dim motion-safe:md:block"
          >
            drag me
          </span>
        </div>
      ))}
    </div>
  );
}
