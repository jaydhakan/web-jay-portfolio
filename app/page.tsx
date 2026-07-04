import { hero } from "@/data/content";
import { DescentArena } from "@/components/hero/DescentArena";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { ImpactStats } from "@/components/sections/ImpactStats";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { BentoCapabilities } from "@/components/sections/BentoCapabilities";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { TechStack } from "@/components/sections/TechStack";
import { CTABanner } from "@/components/sections/CTABanner";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* THE DESCENT ARENA (plan.md): a live, playable gradient-descent loss landscape
          — home's one page-wide governed canvas; poster on mobile/RM. */}
      <DescentArena />
      <Hero />
      <Marquee items={hero.marquee} />
      <ImpactStats />
      <FeaturedWork />
      <BentoCapabilities />
      <Process />
      <Testimonials />
      <TechStack />
      <CTABanner />
    </main>
  );
}
