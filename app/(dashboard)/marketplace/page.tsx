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
import { StorefrontVisibilityPanel } from "@/components/storefront-visibility-panel";
import { MarketplacePageClient } from "@/components/marketplace-page-client";
import { ToastOnMount } from "@/components/toast-on-mount";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";

async function ListingsGrid({
  userId,
  currency,
  page,
  searchParams,
}: {
  userId: string;
  currency: string;
  page: number;
  searchParams: Record<string, string>;
}) {
  const { listings, total } = await getListings(userId, page);
  const totalPages = Math.ceil(total / 12);

  if (listings.length === 0 && page === 1) {
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <MarketplaceListingCard
            key={listing.id}
            listing={listing}
            currency={currency}
            vendorMode={true}
            status={listing.status}
            detailHref={`/marketplace/listings/${listing.id}`}
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

async function ConfigPanelWrapper({ userId }: { userId: string }) {
  const [userRow, categories, options] = await Promise.all([
    db
      .select({
        storefront_show_active: users.storefront_show_active,
        storefront_show_pre_order: users.storefront_show_pre_order,
        storefront_show_sold_out: users.storefront_show_sold_out,
        storefront_show_retired: users.storefront_show_retired,
        storefront_show_unpublished: users.storefront_show_unpublished,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
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

  const visibilitySettings = userRow[0] ?? {
    storefront_show_active: true,
    storefront_show_pre_order: true,
    storefront_show_sold_out: false,
    storefront_show_retired: false,
    storefront_show_unpublished: false,
  };

  return (
    <div className="space-y-6">
      <StorefrontVisibilityPanel settings={visibilitySettings} />
      <div className="h-px bg-border" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Add-on options</p>
        <AddonConfigPanel categories={categories} options={options} />
      </div>
    </div>
  );
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
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [userRow] = await db
    .select({ currency: users.currency, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id));
  const currency = userRow?.currency ?? "USD";
  const username = userRow?.username ?? session.user.username;

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={params.toast} />

      <MarketplacePageClient
        username={username}
        configPanel={
          <Suspense fallback={<div className="py-4 text-sm text-muted-foreground">Loading...</div>}>
            <ConfigPanelWrapper userId={session.user.id} />
          </Suspense>
        }
      >
        <Suspense fallback={<MarketplaceListingSkeletonGrid count={8} />}>
          <ListingsGrid
            userId={session.user.id}
            currency={currency}
            page={page}
            searchParams={params}
          />
        </Suspense>
      </MarketplacePageClient>
    </div>
  );
}
