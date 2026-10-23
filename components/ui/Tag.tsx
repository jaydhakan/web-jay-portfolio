import { cn } from "@/lib/utils";

type TagProps = {
  className?: string;
  children: React.ReactNode;
};

export function Tag({ className, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-elevated px-3 py-1 text-xs font-medium text-ink-dim ring-1 ring-inset ring-white/[0.05]",
        className,
      )}
    >
      {children}
    </span>
  );
}
