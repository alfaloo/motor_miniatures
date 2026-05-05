"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  addonCategories,
  addonOptions,
  listingAddons,
  marketplaceListings,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type AffectedListing = { id: string; title: string };

async function getSession() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

async function recomputeTotalPrice(tx: DbTx, listingId: string) {
  const [listing] = await tx
    .select({ base_price: marketplaceListings.base_price })
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1);

  if (!listing) return;

  const [result] = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${addonOptions.price}), 0)`,
    })
    .from(listingAddons)
    .innerJoin(addonOptions, eq(listingAddons.addon_option_id, addonOptions.id))
    .where(eq(listingAddons.listing_id, listingId));

  const addonsSum = Number(result?.total ?? 0);
  const totalPrice = listing.base_price + addonsSum;

  await tx
    .update(marketplaceListings)
    .set({ total_price: totalPrice })
    .where(eq(marketplaceListings.id, listingId));
}

// --- Category actions ---

export async function createCategory(name: string) {
  const session = await getSession();

  await db.insert(addonCategories).values({
    user_id: session.user.id,
    name: name.trim(),
  });

  revalidatePath("/marketplace");
  return { success: true };
}

export async function updateCategory(id: string, name: string) {
  const session = await getSession();

  const [existing] = await db
    .select()
    .from(addonCategories)
    .where(
      and(
        eq(addonCategories.id, id),
        eq(addonCategories.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Category not found or access denied" };
  }

  await db
    .update(addonCategories)
    .set({ name: name.trim() })
    .where(eq(addonCategories.id, id));

  revalidatePath("/marketplace");
  return { success: true };
}

export async function deleteCategory(
  id: string
): Promise<{ success: true } | { error: string } | { affected: AffectedListing[] }> {
  const session = await getSession();

  const [category] = await db
    .select()
    .from(addonCategories)
    .where(
      and(
        eq(addonCategories.id, id),
        eq(addonCategories.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!category) {
    return { error: "Category not found or access denied" };
  }

  const options = await db
    .select({ id: addonOptions.id })
    .from(addonOptions)
    .where(eq(addonOptions.category_id, id));

  if (options.length === 0) {
    await db.delete(addonCategories).where(eq(addonCategories.id, id));
    revalidatePath("/marketplace");
    return { success: true };
  }

  const optionIds = options.map((o) => o.id);

  const affectedJoins = await db
    .select({ listing_id: listingAddons.listing_id })
    .from(listingAddons)
    .where(inArray(listingAddons.addon_option_id, optionIds));

  if (affectedJoins.length === 0) {
    await db.delete(addonCategories).where(eq(addonCategories.id, id));
    revalidatePath("/marketplace");
    return { success: true };
  }

  const affectedListingIds = [...new Set(affectedJoins.map((j) => j.listing_id))];

  const listings = await db
    .select({
      id: marketplaceListings.id,
      brand: marketplaceListings.brand,
      make: marketplaceListings.make,
      model: marketplaceListings.model,
      variant: marketplaceListings.variant,
    })
    .from(marketplaceListings)
    .where(inArray(marketplaceListings.id, affectedListingIds));

  const affected: AffectedListing[] = listings.map((l) => ({
    id: l.id,
    title: `${l.brand} ${l.make} ${l.model} ${l.variant}`.trim(),
  }));

  return { affected };
}

// --- Option actions ---

export async function createOption(
  categoryId: string,
  name: string,
  priceInCents: number
) {
  const session = await getSession();

  const [newOption] = await db
    .insert(addonOptions)
    .values({
      category_id: categoryId,
      user_id: session.user.id,
      name: name.trim(),
      price: priceInCents,
    })
    .returning();

  revalidatePath("/marketplace");
  return { success: true, option: newOption };
}

export async function updateOption(
  id: string,
  name: string,
  priceInCents: number
) {
  const session = await getSession();

  const [existing] = await db
    .select()
    .from(addonOptions)
    .where(
      and(eq(addonOptions.id, id), eq(addonOptions.user_id, session.user.id))
    )
    .limit(1);

  if (!existing) {
    return { error: "Option not found or access denied" };
  }

  const affectedListingIds = await db.transaction(async (tx) => {
    await tx
      .update(addonOptions)
      .set({ name: name.trim(), price: priceInCents })
      .where(eq(addonOptions.id, id));

    const joins = await tx
      .select({ listing_id: listingAddons.listing_id })
      .from(listingAddons)
      .where(eq(listingAddons.addon_option_id, id));

    const listingIds = [...new Set(joins.map((j) => j.listing_id))];

    for (const listingId of listingIds) {
      await recomputeTotalPrice(tx as DbTx, listingId);
    }

    return listingIds;
  });

  revalidatePath("/marketplace");
  for (const listingId of affectedListingIds) {
    revalidatePath(`/marketplace/listings/${listingId}`);
  }

  return { success: true };
}

export async function deleteOption(
  id: string
): Promise<{ success: true } | { error: string } | { affected: AffectedListing[] }> {
  const session = await getSession();

  const [option] = await db
    .select()
    .from(addonOptions)
    .where(
      and(eq(addonOptions.id, id), eq(addonOptions.user_id, session.user.id))
    )
    .limit(1);

  if (!option) {
    return { error: "Option not found or access denied" };
  }

  const affectedJoins = await db
    .select({ listing_id: listingAddons.listing_id })
    .from(listingAddons)
    .where(eq(listingAddons.addon_option_id, id));

  if (affectedJoins.length === 0) {
    await db.delete(addonOptions).where(eq(addonOptions.id, id));
    revalidatePath("/marketplace");
    return { success: true };
  }

  const affectedListingIds = [...new Set(affectedJoins.map((j) => j.listing_id))];

  const listings = await db
    .select({
      id: marketplaceListings.id,
      brand: marketplaceListings.brand,
      make: marketplaceListings.make,
      model: marketplaceListings.model,
      variant: marketplaceListings.variant,
    })
    .from(marketplaceListings)
    .where(inArray(marketplaceListings.id, affectedListingIds));

  const affected: AffectedListing[] = listings.map((l) => ({
    id: l.id,
    title: `${l.brand} ${l.make} ${l.model} ${l.variant}`.trim(),
  }));

  return { affected };
}

export async function forceDeleteOption(id: string) {
  const session = await getSession();

  const [option] = await db
    .select()
    .from(addonOptions)
    .where(
      and(eq(addonOptions.id, id), eq(addonOptions.user_id, session.user.id))
    )
    .limit(1);

  if (!option) {
    return { error: "Option not found or access denied" };
  }

  const affectedJoins = await db
    .select({ listing_id: listingAddons.listing_id })
    .from(listingAddons)
    .where(eq(listingAddons.addon_option_id, id));

  const affectedListingIds = [...new Set(affectedJoins.map((j) => j.listing_id))];

  await db.transaction(async (tx) => {
    await tx
      .delete(listingAddons)
      .where(eq(listingAddons.addon_option_id, id));

    for (const listingId of affectedListingIds) {
      await recomputeTotalPrice(tx as DbTx, listingId);
    }

    await tx.delete(addonOptions).where(eq(addonOptions.id, id));
  });

  revalidatePath("/marketplace");
  for (const listingId of affectedListingIds) {
    revalidatePath(`/marketplace/listings/${listingId}`);
  }

  return { success: true };
}

export async function forceDeleteCategory(id: string) {
  const session = await getSession();

  const [category] = await db
    .select()
    .from(addonCategories)
    .where(
      and(
        eq(addonCategories.id, id),
        eq(addonCategories.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!category) {
    return { error: "Category not found or access denied" };
  }

  const options = await db
    .select({ id: addonOptions.id })
    .from(addonOptions)
    .where(eq(addonOptions.category_id, id));

  const optionIds = options.map((o) => o.id);
  let affectedListingIds: string[] = [];

  if (optionIds.length > 0) {
    const affectedJoins = await db
      .select({ listing_id: listingAddons.listing_id })
      .from(listingAddons)
      .where(inArray(listingAddons.addon_option_id, optionIds));

    affectedListingIds = [...new Set(affectedJoins.map((j) => j.listing_id))];
  }

  await db.transaction(async (tx) => {
    if (optionIds.length > 0) {
      await tx
        .delete(listingAddons)
        .where(inArray(listingAddons.addon_option_id, optionIds));

      for (const listingId of affectedListingIds) {
        await recomputeTotalPrice(tx as DbTx, listingId);
      }
    }

    await tx.delete(addonCategories).where(eq(addonCategories.id, id));
  });

  revalidatePath("/marketplace");
  for (const listingId of affectedListingIds) {
    revalidatePath(`/marketplace/listings/${listingId}`);
  }

  return { success: true };
}
