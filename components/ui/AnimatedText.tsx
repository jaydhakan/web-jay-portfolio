import { cn } from "@/lib/utils";

type AnimatedTextProps = {
  text: string;
  className?: string;
  /** Seconds before the first character starts. */
  delay?: number;
  /** Seconds between characters. */
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

/**
 * Character-stagger reveal, server-rendered as CSS animation: paints without
 * hydration (LCP-safe), runs with JS disabled, and prefers-reduced-motion
 * strips it to static text. Split per word so line wrapping stays natural;
 * screen readers get the intact string via aria-label.
 */
export function AnimatedText({
  text,
  className,
  delay = 0,
  stagger = 0.025,
  as: Tag = "span",
}: AnimatedTextProps) {
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <Tag className={cn(className)} aria-label={text}>
      <span aria-hidden>
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {Array.from(word).map((char, i) => {
              const order = charIndex++;
              return (
                <span
                  key={i}
                  className="anim-char"
                  style={{ animationDelay: `${(delay + order * stagger).toFixed(3)}s` }}
                >
                  {char}
                </span>
              );
            })}
            {wordIdx < words.length - 1 && <span>&nbsp;</span>}
          </span>
        ))}
      </span>
    </Tag>
  );
}
