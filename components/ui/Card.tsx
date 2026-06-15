import { cn } from "@/lib/utils";

type CardProps = {
  /** Accent border + glow on hover (DESIGN.md). Disable for static panels. */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Double-bezel card (plan.md §4.4): outer shell is the hairline-ring bezel
 * frame; inner core carries the surface fill, content classes (padding,
 * layout), and an inset top highlight. 24px outer radius / 18px inner radius.
 */
export function Card({ interactive = true, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "h-full rounded-3xl bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]",
        interactive && "transition duration-200 ease-out hover:ring-accent/30 hover:shadow-glow",
      )}
    >
      <div
        className={cn(
          "relative h-full rounded-[1.125rem] bg-surface ring-1 ring-inset ring-white/[0.04]",
          className,
        )}
      >
        {/* inset top highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[1.125rem] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
        />
        {children}
      </div>
    </div>
  );
}
