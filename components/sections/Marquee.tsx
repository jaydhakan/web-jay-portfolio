"use client";

import { useRef } from "react";
import { useVelocityFrame } from "@/lib/velocity-bus";

type MarqueeProps = {
  items: readonly string[];
};

/** Four copies so translateX(-50%) loops seamlessly on wide viewports. */
const COPIES = 4;
/** Max streak, in degrees, at full scroll velocity. */
const MAX_SKEW = 7;

/**
 * Service-category ticker directly below the hero. Decorative (aria-hidden),
 * CSS-driven base loop, frozen under reduced motion via the global safety net.
 *
 * V3 P1 — first proof of the velocity bus: the strip skews with scroll velocity
 * and snaps back at rest, so it reads as part of one momentum system rather than
 * a dumb ticker. The skew is written imperatively (no re-render) to a WRAPPER, so
 * the animated row's own translateX transform is never overwritten. The full
 * speed/direction-follows-scroll treatment lands in P3.
 */
export function Marquee({ items }: MarqueeProps) {
  const skewRef = useRef<HTMLDivElement>(null);

  useVelocityFrame((s) => {
    const el = skewRef.current;
    if (!el) return;
    const skew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, s.velocity * 0.45));
    el.style.transform = `skewX(${skew}deg)`;
  });

  return (
    <div aria-hidden className="overflow-hidden border-y border-line">
      <div ref={skewRef} className="will-change-transform">
        <div className="flex w-max animate-marquee">
          {Array.from({ length: COPIES }, (_, copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {items.map((item) => (
                <li
                  key={item}
                  className="whitespace-nowrap px-8 py-4 text-sm font-medium uppercase tracking-widest text-ink-dim"
                >
                  {item}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
