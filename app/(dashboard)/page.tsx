import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
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

  const allItems = await db
    .select()
    .from(items)
    .where(eq(items.user_id, userId))
    .orderBy(...orderBy);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allItems.slice(start, start + PAGE_SIZE);

  if (totalItems === 0) {
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
      <p className="text-sm text-slate-400">
        {totalItems} {totalItems === 1 ? "item" : "items"}
      </p>
      <CollectionGrid items={pageItems} />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={searchParams}
        />
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
