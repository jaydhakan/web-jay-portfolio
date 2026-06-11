import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-elevated", className)} />;
}

/** Shared page-header shape: eyebrow, title, subtitle. */
export function PageHeaderSkeleton() {
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-14 w-full max-w-xl" />
      <Skeleton className="mt-5 h-5 w-full max-w-md" />
    </div>
  );
}
