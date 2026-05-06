import { Skeleton } from "@/components/ui/skeleton";

export default function PublicListingDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-4 w-44 bg-secondary" />

      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4 bg-secondary" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 bg-secondary rounded-full" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3">
        <Skeleton className="h-4 w-full bg-secondary" />
        <Skeleton className="h-4 w-full bg-secondary" />
        <Skeleton className="h-4 w-2/3 bg-secondary" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-32 bg-secondary" />
        <Skeleton className="h-4 w-full bg-secondary" />
        <Skeleton className="h-4 w-full bg-secondary" />
        <Skeleton className="h-4 w-full bg-secondary" />
        <Skeleton className="h-px w-full bg-secondary" />
        <Skeleton className="h-5 w-full bg-secondary" />
      </div>
    </div>
  );
}
