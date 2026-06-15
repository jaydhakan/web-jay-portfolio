"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SidebarItem = { id: string; label: string };

type CaseStudySidebarProps = {
  title: string;
  items: SidebarItem[];
};

/**
 * Sticky section nav for the case-study split (catalog #13). An accent indicator
 * slides along the rail to the section in view — the active-item line indicator
 * formalizing the scrollytelling. IntersectionObserver drives the active id;
 * the indicator transform/height are written straight to the DOM (no per-frame
 * state). Anchor clicks route through the global Lenis handler.
 */
export function CaseStudySidebar({ title, items }: CaseStudySidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  // Slide the accent indicator to the active item.
  useEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator || !activeId) return;
    const el = list.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (!el) return;
    indicator.style.transform = `translateY(${el.offsetTop}px)`;
    indicator.style.height = `${el.offsetHeight}px`;
  }, [activeId, items]);

  return (
    <nav aria-label="Case study sections" className="flex flex-col gap-6">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="relative">
        <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-line" />
        <span
          ref={indicatorRef}
          aria-hidden
          className="absolute left-0 top-0 w-px bg-accent transition-[transform,height] duration-300 ease-out"
          style={{ height: 0 }}
        />
        <ul ref={listRef} className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} data-id={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "block rounded py-1.5 pl-4 text-sm transition-colors duration-200",
                  activeId === item.id ? "font-medium text-accent" : "text-ink-dim hover:text-ink",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <Button href="/contact" size="md" className="w-fit">
        Start a Similar Project
      </Button>
    </nav>
  );
}
