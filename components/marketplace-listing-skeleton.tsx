import { Skeleton } from "@/components/ui/skeleton";

export function MarketplaceListingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col gap-3">
      {/* Heading */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-3/4 bg-secondary" />
        <Skeleton className="h-4 w-1/2 bg-secondary" />
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12 bg-secondary rounded-full" />
      </div>

      {/* Price */}
      <Skeleton className="h-4 w-24 bg-secondary" />

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-8 flex-1 bg-secondary" />
        <Skeleton className="h-8 flex-1 bg-secondary" />
      </div>
    </div>
  );
}

export function MarketplaceListingSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <MarketplaceListingSkeleton key={i} />
      ))}
    </div>
  );
}
