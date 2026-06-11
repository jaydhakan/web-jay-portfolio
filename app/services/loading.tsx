import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ServicesLoading() {
  return (
    <main className="pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <PageHeaderSkeleton />
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[460px] rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
