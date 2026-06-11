import { cn } from "@/lib/utils";

type CardProps = {
  /** Indigo border + glow on hover (DESIGN.md). Disable for static panels. */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Card({ interactive = true, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-token bg-surface",
        interactive &&
          "transition duration-200 ease-out hover:border-accent-primary/40 hover:shadow-glow",
        className,
      )}
    >
      {children}
    </div>
  );
}
