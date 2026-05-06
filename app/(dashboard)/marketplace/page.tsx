import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, addonCategories, addonOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getListings } from "@/lib/actions/marketplace";
import { MarketplaceListingCard } from "@/components/marketplace-listing-card";
import { MarketplaceListingSkeletonGrid } from "@/components/marketplace-listing-skeleton";
import { AddonConfigPanel } from "@/components/addon-config-panel";
import { MarketplacePageClient } from "@/components/marketplace-page-client";
import { ToastOnMount } from "@/components/toast-on-mount";
import { ShareLinkModal } from "@/components/share-link-modal";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";

async function ListingsGrid({
  userId,
  currency,
}: {
  userId: string;
  currency: string;
}) {
  const listings = await getListings(userId);

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Tag className="h-16 w-16 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">No listings yet</h2>
          <p className="text-muted-foreground mt-1">
            Create your first listing to get started.
          </p>
        </div>
        <Link href="/marketplace/listings/new">
          <Button variant="outline" className="border-border bg-secondary hover:bg-black/15 text-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            New listing
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <MarketplaceListingCard
          key={listing.id}
          listing={listing}
          currency={currency}
          vendorMode={true}
          detailHref={`/marketplace/listings/${listing.id}`}
          displayImageUrl={listing.display_image_url}
        />
      ))}
    </div>
  );
}

async function AddonConfigPanelWrapper({ userId }: { userId: string }) {
  const [categories, options] = await Promise.all([
    db
      .select({ id: addonCategories.id, name: addonCategories.name })
      .from(addonCategories)
      .where(eq(addonCategories.user_id, userId))
      .orderBy(asc(addonCategories.sort_order), asc(addonCategories.created_at)),
    db
      .select({
        id: addonOptions.id,
        category_id: addonOptions.category_id,
        name: addonOptions.name,
        price: addonOptions.price,
      })
      .from(addonOptions)
      .where(eq(addonOptions.user_id, userId))
      .orderBy(asc(addonOptions.sort_order), asc(addonOptions.created_at)),
  ]);

  return <AddonConfigPanel categories={categories} options={options} />;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [userRow] = await db
    .select({ currency: users.currency })
    .from(users)
    .where(eq(users.id, session.user.id));
  const currency = userRow?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={params.toast} />

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <div className="flex items-center gap-2">
          <ShareLinkModal username={session.user.username} />
          <Link href="/marketplace/listings/new">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              New listing
            </Button>
          </Link>
        </div>
      </div>

      <MarketplacePageClient
        configPanel={
          <Suspense fallback={<div className="py-4 text-sm text-muted-foreground">Loading...</div>}>
            <AddonConfigPanelWrapper userId={session.user.id} />
          </Suspense>
        }
      >
        <Suspense fallback={<MarketplaceListingSkeletonGrid count={8} />}>
          <ListingsGrid userId={session.user.id} currency={currency} />
        </Suspense>
      </MarketplacePageClient>
    </div>
  );
}
