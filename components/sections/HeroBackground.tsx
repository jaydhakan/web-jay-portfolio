"use client";

import { useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useInView, useReducedMotion } from "motion/react";

const HeroShader = dynamic(() => import("./HeroShader"), { ssr: false });

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
 * Mount gate for the shader: skipped under reduced motion or missing WebGL
 * (the CSS gradient fallback underneath stays), unmounted while scrolled
 * past the hero so the GPU goes idle on the rest of the page.
 */
export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px 0px" });
  // false during SSR/hydration, cached WebGL probe on the client.
  const webglOk = useSyncExternalStore(noopSubscribe, probeWebgl, () => false);

  const showShader = !reduceMotion && webglOk && inView;

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 -z-10">
      {showShader && (
        <div className="size-full animate-[rise-in_1.2s_ease-out_both]">
          <HeroShader isLight={resolvedTheme === "light"} />
        </div>
      )}
    </div>
  );
}
