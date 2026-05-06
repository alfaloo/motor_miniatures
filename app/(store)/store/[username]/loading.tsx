import { MarketplaceListingSkeletonGrid } from "@/components/marketplace-listing-skeleton";

export default function StorefrontLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-32 bg-secondary animate-pulse rounded" />
        <div className="h-8 w-48 bg-secondary animate-pulse rounded mt-1" />
      </div>
      <MarketplaceListingSkeletonGrid count={8} />
    </div>
  );
}
