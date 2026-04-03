import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ItemForm } from "@/components/item-form";
import { DeleteItemButton } from "@/components/delete-item-button";
import { ChevronRight } from "lucide-react";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const item = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.user_id, session.user.id)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!item) {
    notFound();
  }

  const user = await db
    .select({ collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  const collectingSinceYear = user?.collecting_since_year ?? new Date().getFullYear();

  const initialData = {
    brand: item.brand,
    make: item.make,
    model: item.model,
    variant: item.variant,
    scale: item.scale as "1/18" | "1/24" | "1/43" | "1/64",
    serial_number: item.serial_number ?? undefined,
    production_count: item.production_count ?? undefined,
    grade: item.grade ?? null,
    purchase_price: item.purchase_price,
    purchase_platform: item.purchase_platform,
    purchase_year: item.purchase_year,
    purchase_month: item.purchase_month,
    is_preorder: item.is_preorder,
    received_year: item.received_year ?? undefined,
    received_month: item.received_month ?? undefined,
    is_sold: item.is_sold,
    sold_price: item.sold_price ?? undefined,
    sold_platform: item.sold_platform ?? undefined,
    sold_year: item.sold_year ?? undefined,
    sold_month: item.sold_month ?? undefined,
    is_wishlist: item.is_wishlist,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={item.is_wishlist ? "/wishlist" : "/"}
          className="hover:text-foreground transition-colors"
        >
          {item.is_wishlist ? "Wishlist" : "Collection"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/items/${item.id}`}
          className="hover:text-foreground transition-colors text-foreground"
        >
          {item.brand} {item.model}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Edit</span>
      </nav>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Item</h1>
        <p className="text-muted-foreground mt-1">
          {item.brand} {item.model} — {item.variant}
        </p>
      </div>

      <ItemForm
        collectingSinceYear={collectingSinceYear}
        initialData={initialData}
        itemId={item.id}
      />

      {/* Delete section */}
      <div className="border-t border-border pt-6">
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-6">
          <h2 className="text-red-400 font-semibold mb-1">Danger Zone</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Permanently delete this item and all its comments. This cannot be undone.
          </p>
          <DeleteItemButton itemId={item.id} isWishlist={item.is_wishlist} />
        </div>
      </div>
    </div>
  );
}
