import { hero } from "@/data/content";
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
