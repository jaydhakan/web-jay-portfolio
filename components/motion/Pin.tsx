"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type PinProps = {
  children: React.ReactNode;
  className?: string;
  /** Pin distance — how far the page scrolls while pinned, e.g. "+=100%". */
  end?: string;
  /** scrub the pinned range (for content that morphs through states). */
  scrub?: boolean | number;
  /** Pin on mobile too. Default false — mobile gets a normal scrolling stack (R4). */
  pinOnMobile?: boolean;
};

/**
 * Pins an element while the page scrolls past it (catalog #10/#12 foundation).
 * invalidateOnRefresh keeps the pin math correct after route changes / resizes
 * / font swaps. Desktop-only by default: on mobile the section scrolls normally
 * so pinned experiences degrade to a vertical stack (R4). Reduced motion never
 * pins. Without JS the content renders in normal flow.
 */
export function Pin({ children, className, end = "+=100%", scrub = true, pinOnMobile = false }: PinProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const query = pinOnMobile
        ? "(prefers-reduced-motion: no-preference)"
        : "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
      mm.add(query, () => {
        ScrollTriggerCreate(ref.current, end, scrub);
      });
    },
    { scope: ref, dependencies: [end, scrub, pinOnMobile] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Pulled out so the matchMedia callback stays declarative; ScrollTrigger is
// created via gsap.timeline so useGSAP scopes + reverts it on cleanup.
function ScrollTriggerCreate(trigger: HTMLDivElement | null, end: string, scrub: boolean | number) {
  if (!trigger) return;
  gsap.timeline({
    scrollTrigger: {
      trigger,
      start: "top top",
      end,
      pin: true,
      scrub,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}
