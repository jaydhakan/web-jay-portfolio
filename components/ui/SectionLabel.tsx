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
        "text-sm font-semibold uppercase tracking-widest text-accent-primary",
        className,
      )}
    >
      {children}
    </p>
  );
}
