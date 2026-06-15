"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Dev-only leak tripwire (plan §6.4). Logs the live ScrollTrigger count on
 * every route change; if it grows without bound across navigations, a section
 * isn't reverting its triggers (the useGSAP({ scope }) contract is broken).
 * Renders nothing and is tree-shaken out of production.
 */
export function ScrollTriggerLeakCounter() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Let the new route mount + ScrollTrigger.refresh settle first.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const count = ScrollTrigger.getAll().length;
        console.debug(`[ST leak counter] ${pathname} → ${count} active ScrollTrigger(s)`);
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
