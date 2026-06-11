"use client";

import { motion, useReducedMotion } from "motion/react";
import { transition } from "@/lib/animations";

type AnimatedTextProps = {
  text: string;
  className?: string;
  /** Seconds before the first character starts. */
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

/**
 * Character-stagger reveal (hero headline). Splits by word so line wrapping
 * stays natural, then staggers characters inside each word. Screen readers
 * get the intact string via aria-label; the split spans are aria-hidden.
 * Reduced motion: renders plain text, no animation.
 */
export function AnimatedText({
  text,
  className,
  delay = 0,
  as: Tag = "span",
}: AnimatedTextProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = text.split(" ");
  let charIndex = 0;

  return (
    <Tag className={className} aria-label={text}>
      <span aria-hidden>
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {Array.from(word).map((char, i) => {
              const order = charIndex++;
              return (
                <motion.span
                  key={i}
                  className="inline-block will-change-transform"
                  initial={{ opacity: 0, y: "0.5em" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition, delay: delay + order * 0.025 }}
                >
                  {char}
                </motion.span>
              );
            })}
            {wordIdx < words.length - 1 && <span>&nbsp;</span>}
          </span>
        ))}
      </span>
    </Tag>
  );
}
