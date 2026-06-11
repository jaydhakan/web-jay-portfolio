import { Skeleton } from "@/components/ui/Skeleton";

export default function CaseStudyLoading() {
  return (
    <main className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <Skeleton className="h-5 w-24" />
        <div className="mt-10 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16">
          <div className="hidden lg:block">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="max-w-3xl">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-5 h-12 w-full max-w-lg" />
            <Skeleton className="mt-5 h-6 w-full max-w-md" />
            <Skeleton className="mt-9 h-24 w-full" />
            <Skeleton className="mt-10 aspect-video w-full rounded-2xl" />
            <Skeleton className="mt-16 h-40 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
