import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ContactLoading() {
  return (
    <main className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <PageHeaderSkeleton />
          <div className="space-y-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
