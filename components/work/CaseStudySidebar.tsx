"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SidebarItem = { id: string; label: string };

type CaseStudySidebarProps = {
  title: string;
  items: SidebarItem[];
};

/** Brittany-Chiang-style sticky section nav: highlights the section in view. */
export function CaseStudySidebar({ title, items }: CaseStudySidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // Active band sits in the upper-middle of the viewport.
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Case study sections" className="flex flex-col gap-6">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <ul className="flex flex-col gap-1 border-l border-token">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "true" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 pl-4 text-sm transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                activeId === item.id
                  ? "border-accent-primary font-medium text-accent-primary"
                  : "border-transparent text-secondary hover:text-primary",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <Button href="/contact" size="md" className="w-fit">
        Start a Similar Project
      </Button>
    </nav>
  );
}
