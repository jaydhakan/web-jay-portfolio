import { stats } from "@/data/content";
import { FadeUp } from "@/components/motion/FadeUp";
import { Counter } from "@/components/motion/Counter";
import { LineDraw } from "@/components/motion/LineDraw";

/**
 * Proof bar (catalog #27 + LineDraw). No cards — quieter content gets the
 * editorial treatment: white mono numerals (accent stays scarce), each with an
 * accent underline that draws left to right as the number counts up. Real
 * numbers only (PRODUCT.md). Server component; the motion lives in client
 * leaves (FadeUp / Counter / LineDraw).
 */
export function Stats() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp
          as="ul"
          stagger={0.12}
          className="grid grid-cols-2 gap-x-8 gap-y-12 sm:gap-x-12 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <li key={stat.label} className="flex flex-col">
              <Counter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                className="text-[2.5rem] font-semibold leading-none tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]"
              />
              <LineDraw viewBox="0 0 48 2" className="mt-5 h-[2px] w-12 text-accent">
                <line
                  data-draw
                  x1="0"
                  y1="1"
                  x2="48"
                  y2="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </LineDraw>
              <span className="mt-5 max-w-[20ch] text-sm leading-snug text-ink-dim">
                {stat.label}
              </span>
            </li>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
