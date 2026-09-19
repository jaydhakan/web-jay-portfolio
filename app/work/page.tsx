import type { Metadata } from "next";
import { seo } from "@/data/content";
import { workFlightCopy, workFlightFilter, workFlightItems } from "@/data/work";
import { FlightStage } from "@/components/flight/FlightStage";
import { FlightFallback } from "@/components/flight/FlightFallback";
import { CTABanner } from "@/components/sections/CTABanner";

export const metadata: Metadata = {
  title: seo.work.title,
  description: seo.work.description,
};

/**
 * /work — The Flight.
 *
 * The flight IS the page header here, so its intro carries the page's only h1.
 * Below it, <FlightFallback> is always in the DOM: it is the accessible,
 * no-JS, sub-680px and skip-link destination, never conditionally removed.
 */
export default function WorkPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <FlightStage
        items={workFlightItems}
        eyebrow={workFlightCopy.eyebrow}
        headline={workFlightCopy.headline}
        headingLevel="h1"
        filter={workFlightFilter}
        fallbackId="work-index"
        />

      <div className="relative z-10 bg-gradient-to-b from-transparent to-base to-[14%] pt-[22vh]">
        <FlightFallback
          id="work-index"
        items={workFlightItems}
        eyebrow={workFlightCopy.indexEyebrow}
          heading={workFlightCopy.indexHeading}
          blurb={workFlightCopy.indexBlurb}
        />
      </div>

      <CTABanner />
    </main>
  );
}
