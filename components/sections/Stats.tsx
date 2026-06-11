import { stats } from "@/data/content";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Stats() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat) => (
            <RevealItem key={stat.label} className="h-full">
              <Card interactive={false} className="h-full p-6 lg:p-8">
                <p className="font-display text-3xl font-bold text-accent-primary sm:text-4xl lg:text-5xl">
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="mt-3 text-sm leading-snug text-secondary">{stat.label}</p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
