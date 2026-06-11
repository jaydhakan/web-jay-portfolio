import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function WorkLoading() {
  return (
    <main className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <PageHeaderSkeleton />
        <div className="mt-14 flex gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[420px] rounded-2xl md:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
