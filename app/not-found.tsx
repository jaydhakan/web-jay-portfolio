import type { Metadata } from "next";
import { siteConfig } from "@/data/content";
import { Button } from "@/components/ui/Button";
import { RevealText } from "@/components/motion/RevealText";
import { LineDraw } from "@/components/motion/LineDraw";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Branded 404 — "Off the contour": a coordinate that fell outside the mapped
 * terrain of The Field. Server component composing the existing client
 * primitives (LineDraw / RevealText / Button), so the page itself stays a
 * server component. The contour-ring LineDraw is the one motion moment (echoing
 * the About-page divider); RevealText is the standard sitewide reveal grammar.
 * Both render fully drawn / fully visible under reduced motion and no-JS (R7).
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-24 pt-32 text-center"
    >
      <LineDraw
        viewBox="0 0 48 48"
        className="size-16 text-accent"
        ariaLabel="Off the contour"
      >
        <circle data-draw cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle data-draw cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.25" fill="none" />
        <circle data-draw cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1" fill="none" />
      </LineDraw>

      <p className="mt-10 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
        <span aria-hidden className="block h-px w-6 bg-accent" />
        404 / Not on the map
      </p>

      <RevealText
        as="h1"
        type="words"
        className="mt-5 max-w-xl font-display text-5xl font-bold tracking-tight text-ink md:text-6xl"
      >
        I can&rsquo;t find that page.
      </RevealText>

      <p className="mt-5 max-w-md text-base leading-relaxed text-ink-dim">
        The link is broken or the page moved. Nothing is lost. Let me point you
        back to solid ground.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button href="/" size="lg" withArrow>
          Back to home
        </Button>
        <Button href="/work" variant="ghost" size="lg">
          See my work
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
    </main>
  );
}
