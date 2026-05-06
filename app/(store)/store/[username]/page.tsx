import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, marketplaceListings, listingAddons } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { MarketplaceListingCard } from "@/components/marketplace-listing-card";
import { MarketplaceListingSkeletonGrid } from "@/components/marketplace-listing-skeleton";
import { Tag } from "lucide-react";

async function StorefrontGrid({
  userId,
  username,
  currency,
}: {
  userId: string;
  username: string;
  currency: string;
}) {
  const listings = await db
    .select({
      id: marketplaceListings.id,
      brand: marketplaceListings.brand,
      make: marketplaceListings.make,
      model: marketplaceListings.model,
      variant: marketplaceListings.variant,
      scale: marketplaceListings.scale,
      is_preorder: marketplaceListings.is_preorder,
      total_price: marketplaceListings.total_price,
      created_at: marketplaceListings.created_at,
      addon_count: count(listingAddons.addon_option_id),
    })
    .from(marketplaceListings)
    .leftJoin(listingAddons, eq(listingAddons.listing_id, marketplaceListings.id))
    .where(eq(marketplaceListings.user_id, userId))
    .groupBy(marketplaceListings.id)
    .orderBy(desc(marketplaceListings.created_at));

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Tag className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">No listings available right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <Link key={listing.id} href={`/store/${username}/${listing.id}`} className="block">
          <MarketplaceListingCard
            listing={listing}
            currency={currency}
            vendorMode={false}
          />
        </Link>
      ))}
    </div>
  );
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [userRow] = await db
    .select({ id: users.id, currency: users.currency })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!userRow) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Minimal header */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">Motor Miniatures</p>
        <h1 className="text-2xl font-bold text-foreground">{username}&apos;s Customs</h1>
      </div>

      {/* Listings grid with Suspense */}
      <Suspense fallback={<MarketplaceListingSkeletonGrid count={8} />}>
        <StorefrontGrid userId={userRow.id} username={username} currency={userRow.currency} />
      </Suspense>
    </div>
  );
}
