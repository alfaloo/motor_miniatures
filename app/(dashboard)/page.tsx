import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CollectionGrid } from "@/components/collection-grid";
import { ItemCardSkeletonGrid } from "@/components/item-card-skeleton";
import { ToastOnMount } from "@/components/toast-on-mount";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
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
  const allItems = await db
    .select()
    .from(items)
    .where(eq(items.user_id, userId))
    .orderBy(
      desc(items.purchase_year),
      desc(items.purchase_month),
      desc(items.created_at)
    );

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

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={params.toast} />

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">My Collection</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        </Button>
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
