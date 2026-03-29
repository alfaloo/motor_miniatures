import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { eq, and, ilike, isNull, desc, sum, count } from "drizzle-orm";
import { SearchForm } from "@/components/search-form";
import { ItemCard } from "@/components/item-card";
import { ItemCardSkeletonGrid } from "@/components/item-card-skeleton";
import { Pagination } from "@/components/pagination";
import { SearchX } from "lucide-react";
import type { SQL } from "drizzle-orm";

const PAGE_SIZE = 12;

function formatDollars(cents: number | null): string {
  const value = cents ?? 0;
  return `$${value.toLocaleString("en-US")}`;
}

function buildWhereConditions(userId: string, params: Record<string, string>): SQL[] {
  const conditions: SQL[] = [eq(items.user_id, userId)];

  if (params.brand) conditions.push(ilike(items.brand, `%${params.brand}%`));
  if (params.make) conditions.push(ilike(items.make, `%${params.make}%`));
  if (params.model) conditions.push(ilike(items.model, `%${params.model}%`));
  if (params.variant) conditions.push(ilike(items.variant, `%${params.variant}%`));
  if (params.scale && params.scale !== "any") conditions.push(eq(items.scale, params.scale));

  if (params.grade && params.grade !== "any") {
    if (params.grade === "ungraded") {
      conditions.push(isNull(items.grade));
    } else {
      const gradeNum = parseInt(params.grade, 10);
      if (!isNaN(gradeNum)) conditions.push(eq(items.grade, gradeNum));
    }
  }

  if (params.serial_number) {
    const n = parseInt(params.serial_number, 10);
    if (!isNaN(n)) conditions.push(eq(items.serial_number, n));
  }
  if (params.production_count) {
    const n = parseInt(params.production_count, 10);
    if (!isNaN(n)) conditions.push(eq(items.production_count, n));
  }

  if (params.purchase_platform)
    conditions.push(ilike(items.purchase_platform, `%${params.purchase_platform}%`));
  if (params.purchase_price) {
    const n = parseInt(params.purchase_price, 10);
    if (!isNaN(n)) conditions.push(eq(items.purchase_price, n));
  }
  if (params.purchase_year) {
    const n = parseInt(params.purchase_year, 10);
    if (!isNaN(n)) conditions.push(eq(items.purchase_year, n));
  }
  if (params.purchase_month) {
    const n = parseInt(params.purchase_month, 10);
    if (!isNaN(n)) conditions.push(eq(items.purchase_month, n));
  }
  if (params.is_preorder) {
    if (params.is_preorder === "yes") conditions.push(eq(items.is_preorder, true));
    else if (params.is_preorder === "no") conditions.push(eq(items.is_preorder, false));
  }

  if (params.received_year) {
    const n = parseInt(params.received_year, 10);
    if (!isNaN(n)) conditions.push(eq(items.received_year, n));
  }
  if (params.received_month) {
    const n = parseInt(params.received_month, 10);
    if (!isNaN(n)) conditions.push(eq(items.received_month, n));
  }

  if (params.is_sold) {
    if (params.is_sold === "yes") conditions.push(eq(items.is_sold, true));
    else if (params.is_sold === "no") conditions.push(eq(items.is_sold, false));
  }
  if (params.sold_price) {
    const n = parseInt(params.sold_price, 10);
    if (!isNaN(n)) conditions.push(eq(items.sold_price, n));
  }
  if (params.sold_platform)
    conditions.push(ilike(items.sold_platform, `%${params.sold_platform}%`));
  if (params.sold_year) {
    const n = parseInt(params.sold_year, 10);
    if (!isNaN(n)) conditions.push(eq(items.sold_year, n));
  }
  if (params.sold_month) {
    const n = parseInt(params.sold_month, 10);
    if (!isNaN(n)) conditions.push(eq(items.sold_month, n));
  }

  return conditions;
}

async function SearchResults({
  userId,
  params,
}: {
  userId: string;
  params: Record<string, string>;
}) {
  const conditions = buildWhereConditions(userId, params);
  const whereClause = and(...conditions);

  // Summary query
  const summaryRows = await db
    .select({
      totalCount: count(),
      totalPurchaseValue: sum(items.purchase_price),
    })
    .from(items)
    .where(whereClause);

  const summary = summaryRows[0];
  const totalCount = Number(summary?.totalCount ?? 0);
  const totalPurchaseValue = Number(summary?.totalPurchaseValue ?? 0);

  // Total sale value: only sold items
  const soldSummaryRows = await db
    .select({ totalSoldValue: sum(items.sold_price) })
    .from(items)
    .where(and(whereClause, eq(items.is_sold, true)));

  const totalSoldValue = Number(soldSummaryRows[0]?.totalSoldValue ?? 0);

  // Paginated results
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const resultItems = await db
    .select()
    .from(items)
    .where(whereClause)
    .orderBy(desc(items.purchase_year), desc(items.purchase_month), desc(items.created_at))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <>
      {/* Results summary info bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-6 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Matched Items</span>
          <span className="text-2xl font-bold text-white">{totalCount}</span>
        </div>
        <div className="w-px h-10 bg-slate-700 hidden sm:block" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Total Purchase Value</span>
          <span className="text-2xl font-bold text-blue-400">{formatDollars(totalPurchaseValue)}</span>
        </div>
        <div className="w-px h-10 bg-slate-700 hidden sm:block" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Total Sale Value</span>
          <span className="text-2xl font-bold text-green-400">{formatDollars(totalSoldValue)}</span>
        </div>
      </div>

      {/* No results */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <SearchX className="h-16 w-16 text-slate-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-300">No items match your filters</h2>
            <p className="text-slate-500 mt-1">Try adjusting your search criteria.</p>
          </div>
        </div>
      )}

      {/* Results grid */}
      {resultItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resultItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={params}
        />
      )}
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-6 items-center">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
          <div className="h-7 w-12 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
          <div className="h-7 w-20 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-7 w-20 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
      <ItemCardSkeletonGrid />
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch user's collecting_since_year
  const userRows = await db
    .select({ collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const collectingSinceYear =
    userRows[0]?.collecting_since_year ?? new Date().getFullYear();

  const params = await searchParams;

  const filterKeys = [
    "brand", "make", "model", "variant", "scale", "grade",
    "serial_number", "production_count",
    "purchase_platform", "purchase_price", "purchase_year", "purchase_month", "is_preorder",
    "received_year", "received_month",
    "is_sold", "sold_price", "sold_platform", "sold_year", "sold_month",
  ];

  const hasFilters = filterKeys.some((k) => {
    const val = params[k];
    return val !== undefined && val !== "" && val !== "any";
  });

  if (!hasFilters) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <p className="text-sm text-slate-400 mt-1">
            Filter your collection by any combination of fields.
          </p>
        </div>
        <SearchForm collectingSinceYear={collectingSinceYear} />
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <SearchX className="h-16 w-16 text-slate-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-300">
              Use the filters above to search your collection
            </h2>
            <p className="text-slate-500 mt-1">
              Select one or more filters and click Search to find items.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <p className="text-sm text-slate-400 mt-1">
          Filter your collection by any combination of fields.
        </p>
      </div>

      <SearchForm collectingSinceYear={collectingSinceYear} defaultValues={params} />

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults userId={session.user.id} params={params} />
      </Suspense>
    </div>
  );
}
