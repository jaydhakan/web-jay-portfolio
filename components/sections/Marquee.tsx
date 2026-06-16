type MarqueeProps = {
  items: readonly string[];
};

/** Four copies so translateX(-50%) loops seamlessly on wide viewports. */
const COPIES = 4;

/**
 * Service-category ticker directly below the hero (master prompt spec).
 * Decorative: aria-hidden, CSS-driven, frozen under reduced motion via the
 * global safety net. The categories live properly in the Services section.
 */
export function Marquee({ items }: MarqueeProps) {
  return (
    <div aria-hidden className="overflow-hidden border-y border-line">
      <div className="flex w-max animate-marquee">
        {Array.from({ length: COPIES }, (_, copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {items.map((item) => (
              <li
                key={item}
                className="whitespace-nowrap px-8 py-4 text-sm font-medium uppercase tracking-widest text-ink-dim"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
