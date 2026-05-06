import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, addonCategories, addonOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getListingDetail } from "@/lib/actions/marketplace";
import { ListingForm } from "@/components/listing-form";
import { ChevronRight } from "lucide-react";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [listing, userRow, categories, options] = await Promise.all([
    getListingDetail(id),
    db
      .select({ currency: users.currency })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then((rows) => rows[0]),
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

  if (!listing || listing.user_id !== session.user.id) {
    notFound();
  }

  const currency = userRow?.currency ?? "USD";

  // Extract selected addon_option_ids from the listing's addon_groups
  const selectedAddonOptionIds = listing.addon_groups.flatMap((group) =>
    group.options.map((opt) => opt.id)
  );

  const initialData = {
    brand: listing.brand,
    make: listing.make,
    model: listing.model,
    variant: listing.variant,
    scale: listing.scale as "1/18" | "1/24" | "1/43" | "1/64",
    production_count: listing.production_count ?? undefined,
    description: listing.description ?? undefined,
    is_made_to_order: listing.is_made_to_order,
    preorder_wait_days: listing.preorder_wait_days ?? null,
    addon_option_ids: selectedAddonOptionIds,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-foreground transition-colors">
          Marketplace
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/marketplace/listings/${id}`}
          className="hover:text-foreground transition-colors text-foreground"
        >
          {listing.brand} {listing.model}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Edit</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Listing</h1>
        <p className="text-muted-foreground mt-1">
          {listing.brand} {listing.model} — {listing.variant}
        </p>
      </div>

      <ListingForm
        categories={categories}
        options={options}
        currency={currency}
        initialData={initialData}
        listingId={id}
      />
    </div>
  );
}
