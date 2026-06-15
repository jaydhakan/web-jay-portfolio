import { cn } from "@/lib/utils";

type SectionLabelProps = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Eyebrow label above a section heading ("MY WORK").
 * Budget: max 1 per 3 sections on a page — most sections render the heading
 * alone. Use only where the heading genuinely needs categorizing.
 */
export function SectionLabel({ className, children }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-dim",
        className,
      )}
    >
      <span aria-hidden className="block h-px w-6 bg-accent" />
      {children}
    </p>
  );
}
