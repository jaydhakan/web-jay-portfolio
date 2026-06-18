"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { blurProps } from "@/lib/blur";
import { useGovernedCanvas } from "@/lib/webgl-governance";

const FlowImageCanvas = dynamic(() => import("./FlowImageCanvas"), { ssr: false });

type FlowImageProps = {
  src: string;
  /** Real alt text (kept on the authoritative next/image). Empty = decorative. */
  alt: string;
  /** Passed to next/image; the flow canvas is the same file, sampled. */
  sizes: string;
  priority?: boolean;
  /** Extra classes for the next/image (e.g. ken-burns). */
  imageClassName?: string;
};

/**
 * A project cover with the V3 P6 / S5 WebGL flowmap on top. The next/image is the
 * authoritative layer — SSR, LCP, no-JS, screen readers all use IT (real alt,
 * blur-up, priority). The WebGL canvas is an aria-hidden decoration that mounts
 * ONLY when: motion is allowed, WebGL exists, the device is a desktop fine-pointer
 * (the audit/mobile profile keeps the plain image), AND the cover is in view
 * (governance: off-screen covers run no GPU). It samples the same file and ripples
 * it with the velocity bus + a hover melt, then fades in over the still image.
 *
 * Drop-in for the `<Image fill ... />` covers across /work, home, and case study:
 * the wrapper has no size of its own — the parent's positioned/aspect box owns it,
 * exactly like the bare next/image did.
 */
export function FlowImage({ src, alt, sizes, priority, imageClassName }: FlowImageProps) {
  // Governed gate (shared rig): desktop fine-pointer + motion + WebGL + in-view,
  // armed after first paint so it never competes with LCP. Coarse / small / reduced
  // motion keep the crisp still image; off-screen covers run no GPU.
  const { ref, show: showCanvas } = useGovernedCanvas({
    profile: "desktop-fine",
    rootMargin: "300px 0px",
    arm: true,
  });

  return (
    <div ref={ref} className="absolute inset-0">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
        {...blurProps(src)}
      />
      {showCanvas && (
        <div data-flow-canvas className="absolute inset-0 animate-[rise-in_0.6s_ease-out_both]">
          <FlowImageCanvas src={src} />
        </div>
      )}
    </div>
  );
}
