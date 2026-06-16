"use client";

import { useEffect } from "react";
import { siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { RevealText } from "@/components/motion/RevealText";
import { LineDraw } from "@/components/motion/LineDraw";

/**
 * Branded runtime-error boundary — "the descent diverged": the optimizer left
 * the mapped terrain. Must be a client component ({ error, reset }). The primary
 * action is reset() (Button in its no-href button form); error.message is never
 * shown (it could leak internals) — it is logged for debugging, and only the
 * server-stripped error.digest is surfaced as a quiet reference line. Same
 * "Off the contour" shell + contour-ring motion moment as not-found; fully
 * static under reduced motion and no-JS (R7).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-24 pt-32 text-center"
    >
      <LineDraw
        viewBox="0 0 48 48"
        className="size-16 text-accent"
        ariaLabel="Descent diverged"
      >
        <circle data-draw cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle data-draw cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <circle data-draw cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" fill="none" />
      </LineDraw>

      <p className="mt-10 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
        <span aria-hidden className="block h-px w-6 bg-accent" />
        Error / Descent diverged
      </p>

      <RevealText
        as="h1"
        type="words"
        className="mt-5 max-w-xl font-display text-5xl font-bold tracking-tight text-ink md:text-6xl"
      >
        Something broke on my end.
      </RevealText>

      <p className="mt-5 max-w-md text-base leading-relaxed text-ink-dim">
        That one is on me, not you. Try again, and if it keeps happening, reach
        out and I&rsquo;ll fix it.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="lg" withArrow onClick={() => reset()}>
          Try again
        </Button>
        <Button href="/" variant="ghost" size="lg">
          Back to home
        </Button>
      </div>

      <p className="mt-6 font-mono text-xs text-ink-dim">
        Or reach me at{" "}
        <a
          href={`mailto:${siteConfig.email}`}
          className="rounded text-accent transition-colors duration-200 hover:text-ink"
        >
          {siteConfig.email}
        </a>
      </p>

      {error.digest && (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim/60">
          Reference: {error.digest}
        </p>
      )}
    </main>
  );
}
