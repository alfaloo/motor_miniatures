import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq, desc, asc, sql, ilike, isNull } from "drizzle-orm";
import { CollectionGrid } from "@/components/collection-grid";
import { ItemCardSkeletonGrid } from "@/components/item-card-skeleton";
import { ToastOnMount } from "@/components/toast-on-mount";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { SortControls } from "@/components/sort-controls";
import { Plus, PackageOpen } from "lucide-react";

const PAGE_SIZE = 12;

async function CollectionItems({
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

  // --- Filter conditions ---
  const FILTER_KEYS = [
    "brand", "make", "model", "variant", "scale", "grade",
    "serial_number", "production_count", "purchase_platform", "purchase_price",
    "purchase_year", "purchase_month", "is_preorder", "received_year", "received_month",
    "is_sold", "sold_price", "sold_platform", "sold_year", "sold_month",
  ];

  function isActiveFilter(val: string | undefined): boolean {
    return Boolean(val && val !== "" && val !== "any");
  }

  const hasActiveFilter = FILTER_KEYS.some((k) => isActiveFilter(searchParams[k]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions: any[] = [eq(items.user_id, userId)];

  const fp = searchParams;

  if (isActiveFilter(fp.brand)) whereConditions.push(ilike(items.brand, `%${fp.brand}%`));
  if (isActiveFilter(fp.make)) whereConditions.push(ilike(items.make, `%${fp.make}%`));
  if (isActiveFilter(fp.model)) whereConditions.push(ilike(items.model, `%${fp.model}%`));
  if (isActiveFilter(fp.variant)) whereConditions.push(ilike(items.variant, `%${fp.variant}%`));
  if (isActiveFilter(fp.scale)) whereConditions.push(eq(items.scale, fp.scale!));
  if (isActiveFilter(fp.grade)) {
    if (fp.grade === "ungraded") {
      whereConditions.push(isNull(items.grade));
    } else {
      const g = parseInt(fp.grade!, 10);
      if (!isNaN(g)) whereConditions.push(eq(items.grade, g));
    }
  }
  if (isActiveFilter(fp.serial_number)) {
    const v = parseInt(fp.serial_number!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.serial_number, v));
  }
  if (isActiveFilter(fp.production_count)) {
    const v = parseInt(fp.production_count!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.production_count, v));
  }
  if (isActiveFilter(fp.purchase_platform)) whereConditions.push(ilike(items.purchase_platform, `%${fp.purchase_platform}%`));
  if (isActiveFilter(fp.purchase_price)) {
    const v = parseInt(fp.purchase_price!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.purchase_price, v));
  }
  if (isActiveFilter(fp.purchase_year)) {
    const v = parseInt(fp.purchase_year!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.purchase_year, v));
  }
  if (isActiveFilter(fp.purchase_month)) {
    const v = parseInt(fp.purchase_month!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.purchase_month, v));
  }
  if (isActiveFilter(fp.is_preorder)) {
    whereConditions.push(eq(items.is_preorder, fp.is_preorder === "yes"));
  }
  if (isActiveFilter(fp.received_year)) {
    const v = parseInt(fp.received_year!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.received_year, v));
  }
  if (isActiveFilter(fp.received_month)) {
    const v = parseInt(fp.received_month!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.received_month, v));
  }
  if (isActiveFilter(fp.is_sold)) {
    whereConditions.push(eq(items.is_sold, fp.is_sold === "yes"));
  }
  if (isActiveFilter(fp.sold_price)) {
    const v = parseInt(fp.sold_price!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.sold_price, v));
  }
  if (isActiveFilter(fp.sold_platform)) whereConditions.push(ilike(items.sold_platform, `%${fp.sold_platform}%`));
  if (isActiveFilter(fp.sold_year)) {
    const v = parseInt(fp.sold_year!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.sold_year, v));
  }
  if (isActiveFilter(fp.sold_month)) {
    const v = parseInt(fp.sold_month!, 10);
    if (!isNaN(v)) whereConditions.push(eq(items.sold_month, v));
  }

  const allItems = await db
    .select()
    .from(items)
    .where(and(...whereConditions))
    .orderBy(...orderBy);

  // Aggregate values over the full filtered result set
  const matchedCount = allItems.length;
  const totalPurchaseValue = allItems.reduce((sum, item) => sum + item.purchase_price, 0);
  const totalSoldValue = allItems
    .filter((item) => item.is_sold)
    .reduce((sum, item) => sum + (item.sold_price ?? 0), 0);

  const totalItems = matchedCount;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  if (totalItems === 0 && !hasActiveFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <PackageOpen className="h-16 w-16 text-slate-600" />
        <div>
          <h2 className="text-xl font-semibold text-slate-300">No items yet</h2>
          <p className="text-slate-500 mt-1">
            Start building your collection by adding your first item.
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add your first item
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {hasActiveFilter && (
        <div className="flex flex-wrap gap-6 p-4 bg-card rounded-lg border border-border text-sm" data-summary-bar>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Matched Items</span>
            <span className="text-lg font-semibold">{matchedCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Total Purchase Value</span>
            <span className="text-lg font-semibold">${totalPurchaseValue.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Total Sale Value</span>
            <span className="text-lg font-semibold">${totalSoldValue.toLocaleString()}</span>
          </div>
        </div>
      )}
      {!hasActiveFilter && (
        <p className="text-sm text-slate-400">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </p>
      )}
      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <PackageOpen className="h-16 w-16 text-slate-600" />
          <p className="text-slate-400">No items match your current filters.</p>
        </div>
      ) : (
        <>
          <CollectionGrid items={pageItems} />
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

export default async function CollectionPage({
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

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={params.toast} />

      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">My Collection</h1>
        <div className="flex items-center gap-2">
          <SortControls
            currentSort={sortParam}
            currentDir={dirParam}
            searchParams={params}
          />
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/items/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<ItemCardSkeletonGrid />}>
        <CollectionItems
          userId={session.user.id}
          page={page}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
