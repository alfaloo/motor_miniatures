"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  marketplaceListings,
  listingAddons,
  addonOptions,
  addonCategories,
} from "@/db/schema";
import { eq, and, inArray, sql, desc, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { listingSchema } from "@/lib/validations/listing";

async function getSession() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

function parseFormData(formData: FormData) {
  const raw = {
    brand: formData.get("brand") as string,
    make: formData.get("make") as string,
    model: formData.get("model") as string,
    variant: formData.get("variant") as string,
    scale: formData.get("scale") as string,
    production_count: formData.get("production_count")
      ? Number(formData.get("production_count"))
      : undefined,
    description: (formData.get("description") as string) || undefined,
    is_preorder: formData.get("is_preorder") === "true",
    preorder_wait_days: formData.get("preorder_wait_days")
      ? Number(formData.get("preorder_wait_days"))
      : null,
    addon_option_ids: formData.getAll("addon_option_ids").map(String),
  };
  return raw;
}

async function computeTotalPrice(addonOptionIds: string[]): Promise<number> {
  if (addonOptionIds.length === 0) return 0;

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${addonOptions.price}), 0)` })
    .from(addonOptions)
    .where(inArray(addonOptions.id, addonOptionIds));

  return Number(result?.total ?? 0);
}

export async function createListing(formData: FormData) {
  const session = await getSession();

  const raw = parseFormData(formData);
  const parsed = listingSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const totalPrice = await computeTotalPrice(data.addon_option_ids);

  const [listing] = await db
    .insert(marketplaceListings)
    .values({
      user_id: session.user.id,
      brand: data.brand,
      make: data.make,
      model: data.model,
      variant: data.variant,
      scale: data.scale,
      production_count: data.production_count ?? null,
      description: data.description ?? null,
      is_preorder: data.is_preorder,
      preorder_wait_days: data.is_preorder ? (data.preorder_wait_days ?? null) : null,
      total_price: totalPrice,
    })
    .returning({ id: marketplaceListings.id });

  if (data.addon_option_ids.length > 0) {
    await db.insert(listingAddons).values(
      data.addon_option_ids.map((optionId) => ({
        listing_id: listing.id,
        addon_option_id: optionId,
      }))
    );
  }

  revalidatePath("/marketplace");
  redirect("/marketplace?toast=listing_created");
}

export async function updateListing(id: string, formData: FormData) {
  const session = await getSession();

  const [existing] = await db
    .select()
    .from(marketplaceListings)
    .where(
      and(
        eq(marketplaceListings.id, id),
        eq(marketplaceListings.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return { errors: { _form: ["Listing not found or access denied"] } };
  }

  const raw = parseFormData(formData);
  const parsed = listingSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const totalPrice = await computeTotalPrice(data.addon_option_ids);

  // Diff listing_addons
  const currentJoins = await db
    .select({ addon_option_id: listingAddons.addon_option_id })
    .from(listingAddons)
    .where(eq(listingAddons.listing_id, id));

  const currentIds = new Set(currentJoins.map((j) => j.addon_option_id));
  const newIds = new Set(data.addon_option_ids);

  const toRemove = [...currentIds].filter((x) => !newIds.has(x));
  const toAdd = [...newIds].filter((x) => !currentIds.has(x));

  await db
    .update(marketplaceListings)
    .set({
      brand: data.brand,
      make: data.make,
      model: data.model,
      variant: data.variant,
      scale: data.scale,
      production_count: data.production_count ?? null,
      description: data.description ?? null,
      is_preorder: data.is_preorder,
      preorder_wait_days: data.is_preorder ? (data.preorder_wait_days ?? null) : null,
      total_price: totalPrice,
    })
    .where(eq(marketplaceListings.id, id));

  if (toRemove.length > 0) {
    await db
      .delete(listingAddons)
      .where(
        and(
          eq(listingAddons.listing_id, id),
          inArray(listingAddons.addon_option_id, toRemove)
        )
      );
  }

  if (toAdd.length > 0) {
    await db.insert(listingAddons).values(
      toAdd.map((optionId) => ({
        listing_id: id,
        addon_option_id: optionId,
      }))
    );
  }

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/listings/${id}`);
  redirect("/marketplace?toast=listing_updated");
}

export async function deleteListing(id: string) {
  const session = await getSession();

  const [existing] = await db
    .select()
    .from(marketplaceListings)
    .where(
      and(
        eq(marketplaceListings.id, id),
        eq(marketplaceListings.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Listing not found or access denied" };
  }

  await db.delete(marketplaceListings).where(eq(marketplaceListings.id, id));

  revalidatePath("/marketplace");
  return { success: true };
}

export async function getListings(userId: string) {
  const listings = await db
    .select({
      id: marketplaceListings.id,
      brand: marketplaceListings.brand,
      make: marketplaceListings.make,
      model: marketplaceListings.model,
      variant: marketplaceListings.variant,
      scale: marketplaceListings.scale,
      is_preorder: marketplaceListings.is_preorder,
      total_price: marketplaceListings.total_price,
      created_at: marketplaceListings.created_at,
      addon_count: count(listingAddons.addon_option_id),
    })
    .from(marketplaceListings)
    .leftJoin(listingAddons, eq(listingAddons.listing_id, marketplaceListings.id))
    .where(eq(marketplaceListings.user_id, userId))
    .groupBy(marketplaceListings.id)
    .orderBy(desc(marketplaceListings.created_at));

  return listings;
}

export type ListingWithAddonCount = Awaited<ReturnType<typeof getListings>>[number];

type AddonOptionWithCategory = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string;
};

type ListingDetailAddonGroup = {
  category_id: string;
  category_name: string;
  options: { id: string; name: string; price: number }[];
};

export type ListingDetail = {
  id: string;
  user_id: string;
  brand: string;
  make: string;
  model: string;
  variant: string;
  scale: string;
  production_count: number | null;
  description: string | null;
  is_preorder: boolean;
  preorder_wait_days: number | null;
  total_price: number;
  created_at: Date;
  addon_groups: ListingDetailAddonGroup[];
};

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, id))
    .limit(1);

  if (!listing) return null;

  const addons = await db
    .select({
      id: addonOptions.id,
      name: addonOptions.name,
      price: addonOptions.price,
      category_id: addonCategories.id,
      category_name: addonCategories.name,
      category_sort_order: addonCategories.sort_order,
      option_sort_order: addonOptions.sort_order,
    })
    .from(listingAddons)
    .innerJoin(addonOptions, eq(listingAddons.addon_option_id, addonOptions.id))
    .innerJoin(addonCategories, eq(addonOptions.category_id, addonCategories.id))
    .where(eq(listingAddons.listing_id, id))
    .orderBy(
      asc(addonCategories.sort_order),
      asc(addonCategories.created_at),
      asc(addonOptions.sort_order),
      asc(addonOptions.created_at)
    );

  // Group add-ons by category
  const groupMap = new Map<string, ListingDetailAddonGroup>();
  for (const addon of addons as AddonOptionWithCategory[]) {
    if (!groupMap.has(addon.category_id)) {
      groupMap.set(addon.category_id, {
        category_id: addon.category_id,
        category_name: addon.category_name,
        options: [],
      });
    }
    groupMap.get(addon.category_id)!.options.push({
      id: addon.id,
      name: addon.name,
      price: addon.price,
    });
  }

  return {
    ...listing,
    addon_groups: [...groupMap.values()],
  };
}
