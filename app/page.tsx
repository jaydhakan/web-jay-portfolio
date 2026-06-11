import { hero } from "@/data/content";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Marquee items={hero.marquee} />
    </main>
  );
}
