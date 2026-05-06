import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ItemForm } from "@/components/item-form";
import { ChevronRight } from "lucide-react";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ wishlist?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const isWishlist = params.wishlist === "true";

  const userRow = await db
    .select({ collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const collectingSinceYear =
    userRow[0]?.collecting_since_year ?? new Date().getFullYear();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={isWishlist ? "/wishlist" : "/"}
          className="hover:text-foreground transition-colors"
        >
          {isWishlist ? "Wishlist" : "Collection"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Add Item</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">Add Item</h1>

      <ItemForm collectingSinceYear={collectingSinceYear} isWishlist={isWishlist} />
    </div>
  );
}
