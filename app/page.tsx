import { hero, siteConfig } from "@/data/content";

// Temporary placeholder — replaced by full homepage sections in build step 8.
export default function Home() {
  return (
    <main id="main-content" className="flex min-h-[100dvh] items-center px-6">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-4 flex items-center gap-2 text-sm text-success">
          <span className="h-2 w-2 rounded-full bg-success" />
          {siteConfig.availabilityNote}
        </p>
        <h1 className="font-display text-5xl font-semibold md:text-7xl">
          {hero.h1Line1}
          <br />
          {hero.h1Line2}
        </h1>
        <p className="mt-6 max-w-lg text-secondary">{hero.subheading}</p>
      </div>
    </main>
  );
}
