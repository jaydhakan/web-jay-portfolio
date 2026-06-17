"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { blurProps } from "@/lib/blur";
import { useInViewport } from "@/lib/webgl-governance";

const ParticlePortraitCanvas = dynamic(() => import("./ParticlePortraitCanvas"), { ssr: false });

const noopSubscribe = () => () => {};
let webglProbe: boolean | null = null;
function probeWebgl() {
  if (webglProbe === null) {
    const canvas = document.createElement("canvas");
    webglProbe = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  }
  return webglProbe;
}

/**
 * Mount gate for the P9 particle portrait (S7). The still next/image is the
 * authoritative poster: SSR, a11y (real alt), no-JS, reduced motion, and the
 * coarse/mobile profile all keep IT. The GPU point cloud only arms when motion
 * is allowed, WebGL exists, the device is a desktop fine-pointer, and the
 * portrait is in view (governance). It samples the same file and fades in over
 * the poster — so the "photo becomes a living cloud" gag never blocks the page.
 */
export function ParticlePortrait({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [eligible] = useState(() => {
    if (typeof window === "undefined") return false;
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches;
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return fine && motionOk && window.innerWidth >= 768;
  });

  const inView = useInViewport(ref, "200px 0px");
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);

  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!eligible || !webglOk) return;
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => setArmed(true)),
    );
    return () => window.cancelAnimationFrame(id);
  }, [eligible, webglOk]);

  const show = eligible && webglOk && inView && armed;

  return (
    <div ref={ref} className="absolute inset-0">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        {...blurProps(src)}
      />
      {show && (
        <div
          aria-hidden
          className="absolute inset-0 animate-[rise-in_0.8s_ease-out_both] [mask-image:radial-gradient(circle_at_center,black_62%,transparent_82%)]"
        >
          <ParticlePortraitCanvas src={src} />
        </div>
      )}
    </div>
  );
}
