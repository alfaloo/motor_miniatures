import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, marketplaceListings, listingAddons, type ListingStatus } from "@/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import { MarketplaceListingCard } from "@/components/marketplace-listing-card";
import { Tag } from "lucide-react";
import {
  getListingFilterOptions,
  type ListingFilterValues,
} from "@/lib/actions/marketplace";
import { StorefrontPageClient } from "@/components/storefront-page-client";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 12;

type StorefrontListing = {
  id: string;
  brand: string;
  make: string;
  model: string;
  variant: string;
  scale: string;
  is_made_to_order: boolean;
  total_price: number;
  created_at: Date;
  display_image_url: string | null;
  status: ListingStatus;
  addon_count: number;
};

function StorefrontGrid({
  listings,
  total,
  currency,
  username,
  page,
  searchParams,
}: {
  listings: StorefrontListing[];
  total: number;
  currency: string;
  username: string;
  page: number;
  searchParams: Record<string, string>;
}) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Tag className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">No listings available right now.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <MarketplaceListingCard
            key={listing.id}
            listing={listing}
            currency={currency}
            vendorMode={false}
            status={listing.status}
            detailHref={`/store/${username}/${listing.id}`}
            displayImageUrl={listing.display_image_url}
          />
        ))}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </>
  );
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { username } = await params;
  const queryParams = await searchParams;

  const [userRow] = await db
    .select({
      id: users.id,
      currency: users.currency,
      storefront_show_active: users.storefront_show_active,
      storefront_show_pre_order: users.storefront_show_pre_order,
      storefront_show_sold_out: users.storefront_show_sold_out,
      storefront_show_retired: users.storefront_show_retired,
      storefront_show_unpublished: users.storefront_show_unpublished,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!userRow) {
    notFound();
  }

  const visibleStatuses: ListingStatus[] = (
    [
      ["active", userRow.storefront_show_active],
      ["pre_order", userRow.storefront_show_pre_order],
      ["sold_out", userRow.storefront_show_sold_out],
      ["retired", userRow.storefront_show_retired],
      ["unpublished", userRow.storefront_show_unpublished],
    ] as [ListingStatus, boolean][]
  )
    .filter(([, show]) => show)
    .map(([status]) => status);

  // If no statuses are visible, show a simple empty state without filter UI
  if (visibleStatuses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Motor Miniatures</p>
          <h1 className="text-2xl font-bold text-foreground">{username}&apos;s Customs</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Tag className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">No listings available right now.</p>
        </div>
      </div>
    );
  }

  const page = Math.max(1, parseInt(queryParams.page ?? "1", 10) || 1);

  // No status filter on storefront — status is controlled by vendor visibility settings
  const filters: ListingFilterValues = {
    brand: queryParams.brand || undefined,
    make: queryParams.make || undefined,
    scale: queryParams.scale || undefined,
    availability: (queryParams.availability as ListingFilterValues["availability"]) || undefined,
  };

  // Build filter conditions alongside the existing visibleStatuses condition
  const conditions: ReturnType<typeof eq>[] = [
    eq(marketplaceListings.user_id, userRow.id),
    inArray(marketplaceListings.status, visibleStatuses),
  ];

  if (filters.brand && filters.brand !== "any") {
    conditions.push(eq(marketplaceListings.brand, filters.brand));
  }
  if (filters.make && filters.make !== "any") {
    conditions.push(eq(marketplaceListings.make, filters.make));
  }
  if (filters.scale && filters.scale !== "any") {
    conditions.push(eq(marketplaceListings.scale, filters.scale));
  }
  if (filters.availability === "ready_stock") {
    conditions.push(eq(marketplaceListings.is_made_to_order, false));
  } else if (filters.availability === "made_to_order") {
    conditions.push(eq(marketplaceListings.is_made_to_order, true));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * PAGE_SIZE;

  const [listings, totalResult, filterOptions] = await Promise.all([
    db
      .select({
        id: marketplaceListings.id,
        brand: marketplaceListings.brand,
        make: marketplaceListings.make,
        model: marketplaceListings.model,
        variant: marketplaceListings.variant,
        scale: marketplaceListings.scale,
        is_made_to_order: marketplaceListings.is_made_to_order,
        total_price: marketplaceListings.total_price,
        created_at: marketplaceListings.created_at,
        display_image_url: marketplaceListings.display_image_url,
        status: marketplaceListings.status,
        addon_count: count(listingAddons.addon_option_id),
      })
      .from(marketplaceListings)
      .leftJoin(listingAddons, eq(listingAddons.listing_id, marketplaceListings.id))
      .where(whereClause)
      .groupBy(marketplaceListings.id)
      .orderBy(desc(marketplaceListings.created_at))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(marketplaceListings)
      .where(whereClause),
    getListingFilterOptions(userRow.id, visibleStatuses),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Motor Miniatures</p>
        <h1 className="text-2xl font-bold text-foreground">{username}&apos;s Customs</h1>
      </div>

      <StorefrontPageClient
        username={username}
        activeFilters={filters}
        filterOptions={filterOptions}
        listingCount={listings.length}
      >
        <StorefrontGrid
          listings={listings}
          total={total}
          currency={userRow.currency}
          username={username}
          page={page}
          searchParams={queryParams}
        />
      </StorefrontPageClient>
    </div>
  );
}
