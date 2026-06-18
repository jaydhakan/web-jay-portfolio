"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { blurProps } from "@/lib/blur";
import { useGovernedCanvas } from "@/lib/webgl-governance";

const ParticlePortraitCanvas = dynamic(() => import("./ParticlePortraitCanvas"), { ssr: false });

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
  const { ref, show } = useGovernedCanvas({
    profile: "desktop-fine",
    rootMargin: "200px 0px",
    arm: true,
  });

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
