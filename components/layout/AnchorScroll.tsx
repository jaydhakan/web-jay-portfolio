"use client";

import { useEffect } from "react";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";

/**
 * Routes in-page hash links (#id) through Lenis so anchor jumps use the same
 * scroll authority as everything else (plan.md §6.2) instead of a native jump
 * that fights Lenis's internal scroll value. After scrolling, focus moves to
 * the target so keyboard/SR users land there (`preventScroll` — Lenis already
 * positioned it).
 *
 * No Lenis (reduced motion / native) → do nothing; the browser's default
 * instant anchor jump + native focus is exactly the right RM behavior.
 */
export function AnchorScroll() {
  const lenis = useLenisInstance();

  useEffect(() => {
    if (!lenis) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      // Skip link must land instantly; section nav glides.
      const immediate = target.id === "main-content";
      lenis.scrollTo(target, { immediate, offset: 0 });
      // Make the target programmatically focusable without a layout-affecting
      // tabindex left behind.
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
      target.focus({ preventScroll: true });
      history.pushState(null, "", hash);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}
