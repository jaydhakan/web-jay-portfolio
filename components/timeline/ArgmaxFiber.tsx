"use client";

import dynamic from "next/dynamic";
import type { ArgmaxCanvasProps } from "./ArgmaxCanvas";

/**
 * Client-only mount for the ArgmaxCanvas. The heavy WebGL scene is code-split
 * (ssr:false) so it never ships in the SSR payload; the parent (SerpentineTimeline)
 * owns the governance gate (desktop + motion + WebGL + in-view + armed) and only
 * renders this when it should run. Fades in over the static SVG poster.
 */
const Canvas = dynamic(() => import("./ArgmaxCanvas"), { ssr: false });

export function ArgmaxFiber(props: ArgmaxCanvasProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 animate-[fade-in_1.4s_ease-out_both]"
    >
      <Canvas {...props} />
    </div>
  );
}
