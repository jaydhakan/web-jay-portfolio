"use client";

import { useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Star } from "lucide-react";
import { testimonials, sections, type Testimonial } from "@/data/content";
import { Card } from "@/components/ui/Card";

const SPEED_PX_S = 38;

function wrapValue(min: number, max: number, value: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="h-full w-[min(85vw,380px)] shrink-0">
      <Card interactive={false} className="flex h-full flex-col p-8">
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: testimonial.rating }, (_, i) => (
            <Star key={i} className="size-4 fill-accent-primary text-accent-primary" />
          ))}
        </div>
        <span className="sr-only">Rated {testimonial.rating} out of 5</span>
        <blockquote className="mt-5 flex-1 text-base leading-relaxed text-primary">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <footer className="mt-6">
          <p className="text-sm font-semibold text-primary">{testimonial.name}</p>
          <p className="mt-0.5 text-xs text-secondary">
            {testimonial.company}, {testimonial.platform}
          </p>
        </footer>
      </Card>
    </div>
  );
}

/**
 * Auto-scrolling, drag-to-explore loop (no visible controls per spec).
 * Position is a motion value mutated per frame; dragging feeds deltas into
 * the same value (the track itself is pinned by zero-size constraints).
 * Pauses while hovered, focused, or dragged. Reduced motion: static grid.
 */
export function Testimonials() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const baseX = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const halfWidth = useRef(0);

  useAnimationFrame((_, delta) => {
    if (paused || reduceMotion) return;
    const el = trackRef.current;
    if (!el) return;
    if (halfWidth.current === 0) halfWidth.current = el.scrollWidth / 2;
    baseX.set(baseX.get() - (SPEED_PX_S * delta) / 1000);
  });

  const x = useTransform(baseX, (v) =>
    halfWidth.current > 0 ? wrapValue(-halfWidth.current, 0, v) : v,
  );

  const heading = (
    <h2 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
      {sections.testimonials.heading}
    </h2>
  );

  if (reduceMotion) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          {heading}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-6">{heading}</div>
      <div
        role="region"
        aria-label="Client testimonials"
        className="mt-12"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <motion.div
          ref={trackRef}
          className="flex w-max cursor-grab gap-6 px-6 active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setPaused(true)}
          onDrag={(_, info) => baseX.set(baseX.get() + info.delta.x)}
          onDragEnd={() => setPaused(false)}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-6" aria-hidden={copy === 1}>
              {testimonials.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
