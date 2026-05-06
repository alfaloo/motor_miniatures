import { Skeleton } from "@/components/ui/skeleton";

export default function NewListingLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-4 w-36 bg-secondary mb-4" />
        <Skeleton className="h-8 w-40 bg-secondary" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-20 bg-secondary" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-16 bg-secondary" />
              <Skeleton className="h-10 w-full bg-secondary" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-20 bg-secondary" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32 bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24 bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
        </div>
        <Skeleton className="h-24 w-full bg-secondary" />
      </div>

      <Skeleton className="h-12 w-full bg-secondary" />
    </div>
  );
}
