import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, addonCategories, addonOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ListingForm } from "@/components/listing-form";
import { ChevronRight } from "lucide-react";

export default async function NewListingPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [userRow] = await db
    .select({ currency: users.currency, collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id));
  const currency = userRow?.currency ?? "USD";
  const collectingSinceYear = userRow?.collecting_since_year ?? new Date().getFullYear();

  const [categories, options] = await Promise.all([
    db
      .select({ id: addonCategories.id, name: addonCategories.name })
      .from(addonCategories)
      .where(eq(addonCategories.user_id, session.user.id))
      .orderBy(asc(addonCategories.sort_order), asc(addonCategories.created_at)),
    db
      .select({
        id: addonOptions.id,
        category_id: addonOptions.category_id,
        name: addonOptions.name,
        price: addonOptions.price,
      })
      .from(addonOptions)
      .where(eq(addonOptions.user_id, session.user.id))
      .orderBy(asc(addonOptions.sort_order), asc(addonOptions.created_at)),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-foreground transition-colors">
          Marketplace
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">New Listing</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground">New Listing</h1>

      <ListingForm
        categories={categories}
        options={options}
        currency={currency}
        collectingSinceYear={collectingSinceYear}
      />
    </div>
  );
}
