import { hero } from "@/data/content";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Stats } from "@/components/sections/Stats";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { TechStack } from "@/components/sections/TechStack";
import { CTABanner } from "@/components/sections/CTABanner";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <Marquee items={hero.marquee} />
      <Stats />
      <FeaturedWork />
      <Services />
      <Process />
      <Testimonials />
      <TechStack />
      <CTABanner />
    </main>
  );
}
