import { techStack } from "@/data/content";
import { sections } from "@/data/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

export function TechStack() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <h2 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
            {sections.techStack.heading}
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {Object.entries(techStack).map(([category, items]) => (
            <RevealItem key={category}>
              <h3 className="text-sm font-semibold text-secondary">{category}</h3>
              <ul className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-4">
                {items.map((item) => (
                  <li
                    key={item.name}
                    className="group flex items-center gap-2.5 text-sm font-medium text-secondary transition-colors duration-200 hover:text-primary"
                  >
                    {item.icon && (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny external SVGs; next/image blocks remote SVG by default
                      <img
                        src={`${DEVICON_BASE}/${item.icon}/${item.icon}-${item.iconVariant ?? "original"}.svg`}
                        alt=""
                        aria-hidden
                        width={24}
                        height={24}
                        loading="lazy"
                        className={cn(
                          "size-6 grayscale transition duration-200 group-hover:grayscale-0",
                          item.iconInvertDark && "invert light:invert-0",
                        )}
                      />
                    )}
                    {item.name}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
