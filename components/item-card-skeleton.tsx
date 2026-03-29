import { Skeleton } from "@/components/ui/skeleton";

export function ItemCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col gap-3">
      {/* Top row: brand + scale */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24 bg-slate-700" />
        <Skeleton className="h-5 w-10 bg-slate-700" />
      </div>

      {/* Model name + variant */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 bg-slate-700" />
      </div>

      {/* Divider */}
      <Skeleton className="h-px w-full bg-slate-700" />

      {/* Grade + purchased */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16 bg-slate-700 rounded-full" />
        <Skeleton className="h-4 w-16 bg-slate-700" />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        <Skeleton className="h-8 flex-1 bg-slate-700" />
        <Skeleton className="h-8 flex-1 bg-slate-700" />
        <Skeleton className="h-8 flex-1 bg-slate-700" />
      </div>
    </div>
  );
}

export function ItemCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
