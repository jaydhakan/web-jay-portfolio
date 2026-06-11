import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AboutLoading() {
  return (
    <main className="pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <PageHeaderSkeleton />
        <Skeleton className="mt-14 h-72 w-full rounded-2xl" />
        <div className="mt-24 space-y-10">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full max-w-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
