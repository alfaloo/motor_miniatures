import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, addonCategories, addonOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ListingForm } from "@/components/listing-form";
import { ChevronLeft } from "lucide-react";

export default async function NewListingPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [userRow] = await db
    .select({ currency: users.currency })
    .from(users)
    .where(eq(users.id, session.user.id));
  const currency = userRow?.currency ?? "USD";

  const [categories, options] = await Promise.all([
    db
      .select({ id: addonCategories.id, name: addonCategories.name })
      .from(addonCategories)
      .where(eq(addonCategories.user_id, session.user.id))
      .orderBy(asc(addonCategories.created_at)),
    db
      .select({
        id: addonOptions.id,
        category_id: addonOptions.category_id,
        name: addonOptions.name,
        price: addonOptions.price,
      })
      .from(addonOptions)
      .where(eq(addonOptions.user_id, session.user.id))
      .orderBy(asc(addonOptions.created_at)),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Listing</h1>
      </div>

      <ListingForm
        categories={categories}
        options={options}
        currency={currency}
      />
    </div>
  );
}
