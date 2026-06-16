import { cn } from "@/lib/utils";

type TagProps = {
  className?: string;
  children: React.ReactNode;
};

export function Tag({ className, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-elevated px-3 py-1 text-xs font-medium text-ink-dim",
        className,
      )}
    >
      {children}
    </span>
  );
}
