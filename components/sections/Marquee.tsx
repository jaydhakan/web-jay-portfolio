"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useVelocityFrame } from "@/lib/velocity-bus";

type MarqueeProps = {
  items: readonly string[];
};

/** Four copies so xPercent:-50 (= 2 copies) loops seamlessly. */
const COPIES = 4;
const MAX_SKEW = 7; // deg streak at full velocity

/**
 * Service-category ticker below the hero, now fully on the velocity bus
 * (plan.md S2 / V3 P3). A GSAP loop drives the base drift; scroll velocity
 * scales its speed and FLIPS its direction (scroll up -> it reverses), and the
 * strip skews into a streak. Decorative (aria-hidden); under reduced motion the
 * bus is silent and no GSAP loop is created, so it stays static.
 *
 * The loop transform lives on the inner strip and the skew on a separate
 * wrapper, so the two never overwrite each other.
 */
export function Marquee({ items }: MarqueeProps) {
  const scope = useRef<HTMLDivElement>(null);
  const skewRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const dir = useRef(1); // last non-zero scroll direction (keeps drifting at rest)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      tween.current = gsap.to(stripRef.current, {
        xPercent: -50,
        duration: 24,
        ease: "none",
        repeat: -1,
      });
    },
    { scope },
  );

  useVelocityFrame((s) => {
    if (s.direction !== 0) dir.current = s.direction;
    const speed = 1 + Math.min(Math.abs(s.velocity) * 0.06, 4.5);
    tween.current?.timeScale(speed * dir.current);
    const el = skewRef.current;
    if (el) {
      const skew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, s.velocity * 0.45));
      el.style.transform = `skewX(${skew}deg)`;
    }
  });

  return (
    <div ref={scope} aria-hidden className="overflow-hidden border-y border-line">
      <div ref={skewRef} className="will-change-transform">
        <div ref={stripRef} className="flex w-max will-change-transform">
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
