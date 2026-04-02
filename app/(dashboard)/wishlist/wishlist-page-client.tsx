"use client";

import { CollectionPageClient } from "@/components/collection-page-client";
import type { FilterValues } from "@/components/filter-panel";

interface WishlistPageClientProps {
  sortParam: string;
  dirParam: string;
  searchParams: Record<string, string>;
  collectingSinceYear: number;
  activeFilters: FilterValues;
  summaryData: {
    matchedCount: number;
    totalPurchaseValue: number;
    totalSoldValue: number;
  } | null;
  children: React.ReactNode;
}

export function WishlistPageClient(props: WishlistPageClientProps) {
  return (
    <CollectionPageClient
      {...props}
      title="My Wishlist"
      addItemHref="/items/new?wishlist=true"
      basePath="/wishlist"
    />
  );
}
