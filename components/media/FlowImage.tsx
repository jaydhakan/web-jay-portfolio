"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { blurProps } from "@/lib/blur";
import { useInViewport } from "@/lib/webgl-governance";

const FlowImageCanvas = dynamic(() => import("./FlowImageCanvas"), { ssr: false });

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl() {
  if (webglProbe === null) {
    const canvas = document.createElement("canvas");
    webglProbe = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  }
  return webglProbe;
}

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
  const ref = useRef<HTMLDivElement>(null);

  // Resolve gating once before first paint, stable for the mount (matches the
  // hero shader + cursor desktop-gating; coarse pointer / small screens and
  // reduced motion never mount the canvas — they keep the crisp still image).
  const [eligible] = useState(() => {
    if (typeof window === "undefined") return false;
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches;
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return fine && motionOk && window.innerWidth >= 768;
  });

  const inView = useInViewport(ref, "300px 0px");
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);

  // Arm after first paint (idle) so the canvas init never competes with LCP/
  // hydration — the still image is the experience until then.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!eligible || !webglOk) return;
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => setArmed(true)),
    );
    return () => window.cancelAnimationFrame(id);
  }, [eligible, webglOk]);

  const showCanvas = eligible && webglOk && inView && armed;

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
