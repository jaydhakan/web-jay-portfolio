"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { techStack, sections } from "@/data/content";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";
import { cn } from "@/lib/utils";

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const SPOT_QUERY =
  "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const noopSubscribe = () => () => {};

/** One grid of the stack. Rendered twice: a readable grayscale base layer and
 *  a full-colour copy that the spotlight mask reveals near the cursor. */
function StackGrid({ lit }: { lit: boolean }) {
  return (
    <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
      {Object.entries(techStack).map(([category, items]) => (
        <div key={category}>
          <h3 className={cn("text-sm font-semibold", lit ? "text-ink" : "text-ink-dim")}>
            {category}
          </h3>
          <ul className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-4">
            {items.map((item) => (
              <li
                key={item.name}
                className={cn(
                  "flex items-center gap-2.5 text-sm font-medium",
                  lit ? "text-ink" : "text-ink-dim",
                )}
              >
                {item.icon && (
                  // eslint-disable-next-line @next/next/no-img-element -- tiny external SVGs; next/image blocks remote SVG by default
                  <img
                    src={`${DEVICON_BASE}/${item.icon}/${item.icon}-${item.iconVariant ?? "original"}.svg`}
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                    loading="lazy"
                    className={cn(
                      "size-6",
                      lit ? "grayscale-0" : "opacity-70 grayscale",
                      item.iconInvertDark && "invert",
                    )}
                  />
                )}
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Tech stack with a mouse-tracked spotlight (catalog #24): the grid renders
 * grayscale and legible by default; on desktop a radial spotlight follows the
 * cursor and saturates the icons + brightens the labels within its radius via
 * a masked colour layer. Cursor position is written to CSS vars (no React
 * state for a continuous value). Desktop + fine pointer + motion-allowed only;
 * the base layer is the full experience everywhere else (R7).
 */
export function TechStack() {
  // false during SSR/hydration; the real capability on the client.
  const spotlight = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia(SPOT_QUERY).matches,
    () => false,
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spotlight) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [spotlight]);

  const spotMask =
    "radial-gradient(200px circle at var(--mx) var(--my), #000 0%, #000 35%, transparent 75%)";

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <RevealText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
        >
          {sections.techStack.heading}
        </RevealText>

        <FadeUp className="mt-14">
          <div
            ref={ref}
            className="group/spot relative"
            style={{ "--mx": "-9999px", "--my": "-9999px" } as React.CSSProperties}
          >
            {/* Ambient spotlight glow, only while the cursor is over the grid. */}
            {spotlight && (
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
                style={{
                  background:
                    "radial-gradient(280px circle at var(--mx) var(--my), oklch(63% 0.21 272 / 0.10), transparent 70%)",
                }}
              />
            )}

            {/* Readable base layer (always present). */}
            <StackGrid lit={false} />

            {/* Full-colour layer revealed only under the spotlight. */}
            {spotlight && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ WebkitMaskImage: spotMask, maskImage: spotMask }}
              >
                <StackGrid lit />
              </div>
            )}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
