"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { velocityListenerCount } from "@/lib/velocity-bus";

/**
 * Dev-only leak tripwire (plan §6.4, extended to GPU in V3 P1). Logs the live
 * ScrollTrigger count, the number of mounted <canvas> elements (a WebGL surface
 * that fails to unmount on route change shows up here), and the velocity-bus
 * subscriber count on every route change. Any of these growing without bound
 * across navigations means a tree isn't cleaning up. Stripped from production.
 */
export function ScrollTriggerLeakCounter() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Let the new route mount + ScrollTrigger.refresh settle first.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const st = ScrollTrigger.getAll().length;
        const canvases = document.querySelectorAll("canvas").length;
        const bus = velocityListenerCount();
        console.debug(
          `[leak] ${pathname} → ST ${st} · canvas ${canvases} · velBus ${bus}`,
        );
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
