import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { and, eq, desc, asc, sql } from "drizzle-orm";
import { CollectionGrid } from "@/components/collection-grid";
import { ItemCardSkeletonGrid } from "@/components/item-card-skeleton";
import { ToastOnMount } from "@/components/toast-on-mount";
import { Pagination } from "@/components/pagination";
import { WishlistPageClient } from "./wishlist-page-client";
import { PackageOpen } from "lucide-react";
import { acquireItem } from "@/lib/actions/items";
import {
  buildItemWhereConditions,
  hasActiveFilters,
  extractActiveFilters,
} from "@/lib/item-filters";

const PAGE_SIZE = 12;

async function WishlistItems({
  userId,
  page,
  searchParams,
}: {
  userId: string;
  page: number;
  searchParams: Record<string, string>;
}) {
  const sortParam = searchParams.sort;
  const dirParam = searchParams.dir;
  const isAsc = dirParam === "asc";
  const dirFn = isAsc ? asc : desc;

  const defaultTiebreak = [
    desc(items.purchase_year),
    desc(items.purchase_month),
    desc(items.created_at),
  ] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any[];
  if (!sortParam || sortParam === "purchase_date") {
    orderBy = [
      dirFn(items.purchase_year),
      dirFn(items.purchase_month),
      dirFn(items.created_at),
    ];
  } else if (sortParam === "purchase_price") {
    orderBy = [dirFn(items.purchase_price), ...defaultTiebreak];
  } else {
    const nullableColMap: Record<string, typeof items.sold_price> = {
      sold_price: items.sold_price,
      serial_number: items.serial_number as unknown as typeof items.sold_price,
      production_count:
        items.production_count as unknown as typeof items.sold_price,
      grade: items.grade as unknown as typeof items.sold_price,
    };
    const col = nullableColMap[sortParam];
    if (col) {
      orderBy = [
        sql`CASE WHEN ${col} IS NULL THEN 1 ELSE 0 END`,
        dirFn(col),
        ...defaultTiebreak,
      ];
    } else {
      orderBy = [...defaultTiebreak];
    }
  }

  const whereConditions = buildItemWhereConditions(searchParams, userId, true);
  const hasFilter = hasActiveFilters(searchParams);

  const allItems = await db
    .select()
    .from(items)
    .where(and(...whereConditions))
    .orderBy(...orderBy);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  if (totalItems === 0 && !hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <PackageOpen className="h-16 w-16 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your wishlist is empty</h2>
          <p className="text-muted-foreground mt-1">
            Add your first item to start tracking what you want to acquire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hasFilter && (
        <p className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </p>
      )}
      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">No items match your current filters.</p>
        </div>
      ) : (
        <>
          <CollectionGrid items={pageItems} onAcquire={acquireItem} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={searchParams}
            />
          )}
        </>
      )}
    </>
  );
}

export default async function WishlistPage({
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

  const sortParam = params.sort ?? "purchase_date";
  const dirParam = params.dir ?? "desc";

  const [userRow] = await db
    .select({ collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id));
  const collectingSinceYear = userRow?.collecting_since_year ?? new Date().getFullYear();

  const activeFilters = extractActiveFilters(params);
  const filterActive = hasActiveFilters(params);

  let summaryData: {
    matchedCount: number;
    totalPurchaseValue: number;
    totalSoldValue: number;
  } | null = null;

  if (filterActive) {
    const whereConditions = buildItemWhereConditions(params, session.user.id, true);
    const [agg] = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalPurchase: sql<number>`coalesce(sum(${items.purchase_price}), 0)::int`,
        totalSold: sql<number>`coalesce(sum(case when ${items.is_sold} = true then coalesce(${items.sold_price}, 0) else 0 end), 0)::int`,
      })
      .from(items)
      .where(and(...whereConditions));
    summaryData = {
      matchedCount: agg.count,
      totalPurchaseValue: agg.totalPurchase,
      totalSoldValue: agg.totalSold,
    };
  }

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={params.toast} />
      <WishlistPageClient
        sortParam={sortParam}
        dirParam={dirParam}
        searchParams={params}
        collectingSinceYear={collectingSinceYear}
        activeFilters={activeFilters}
        summaryData={summaryData}
      >
        <Suspense fallback={<ItemCardSkeletonGrid />}>
          <WishlistItems
            userId={session.user.id}
            page={page}
            searchParams={params}
          />
        </Suspense>
      </WishlistPageClient>
    </div>
  );
}
