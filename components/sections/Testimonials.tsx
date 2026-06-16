import { testimonials, sections } from "@/data/content";
import { RevealText } from "@/components/motion/RevealText";
import { FadeUp } from "@/components/motion/FadeUp";

/**
 * Calm testimonial grid (catalog #1). The Motion auto-scroll carousel is gone
 * (three quotes don't earn a carousel, and it carried a stale-resize bug); each
 * quote now reveals line-by-line behind masks as the row enters — the section's
 * one motion moment. A large accent quote mark anchors each card instead of
 * review-site stars. Server component; reveals live in the RevealText leaves.
 */
export function Testimonials() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <RevealText
          as="h2"
          className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl"
        >
          {sections.testimonials.heading}
        </RevealText>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <li
              key={t.name}
              className="flex flex-col rounded-2xl bg-surface p-8 ring-1 ring-line"
            >
              <span aria-hidden className="font-display text-5xl leading-[0.5] text-accent/40">
                &ldquo;
              </span>
              <blockquote className="mt-5 flex-1">
                {/* FadeUp (block reveal) rather than RevealText here: SplitText's
                    aria:"auto" puts aria-label on the element, which is prohibited
                    on a <p> (paragraph role) and fails the a11y audit. */}
                <FadeUp as="p" className="text-base leading-relaxed text-ink">
                  {t.quote}
                </FadeUp>
              </blockquote>
              <footer className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="mt-0.5 text-xs text-ink-dim">
                  {t.company}, {t.platform}
                </p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
