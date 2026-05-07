"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  marketplaceListings,
  listingAddons,
  addonOptions,
  addonCategories,
  users,
} from "@/db/schema";
import type { ListingStatus } from "@/db/schema";
import { eq, and, inArray, sql, desc, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { listingSchema } from "@/lib/validations/listing";
import { deleteListingImage } from "@/lib/blob";

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
    is_made_to_order: formData.get("is_made_to_order") === "true",
    preorder_wait_days: formData.get("preorder_wait_days")
      ? Number(formData.get("preorder_wait_days"))
      : null,
    addon_option_ids: formData.getAll("addon_option_ids").map(String),
  };
  return raw;
}

async function computeTotalPrice(addons: { id: string; quantity: number }[]): Promise<number> {
  if (addons.length === 0) return 0;

  const ids = addons.map((a) => a.id);
  const prices = await db
    .select({ id: addonOptions.id, price: addonOptions.price })
    .from(addonOptions)
    .where(inArray(addonOptions.id, ids));

  const priceMap = new Map(prices.map((p) => [p.id, p.price]));
  return addons.reduce((sum, a) => sum + (priceMap.get(a.id) ?? 0) * a.quantity, 0);
}

export async function createListing(formData: FormData) {
  const session = await getSession();

  const raw = parseFormData(formData);
  const parsed = listingSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const rawQtys = formData.getAll("addon_option_quantities").map((s) => {
    const n = parseInt(String(s), 10);
    return isNaN(n) || n < 1 ? 1 : n;
  });
  const addonOptionsWithQty = data.addon_option_ids.map((id, i) => ({
    id,
    quantity: rawQtys[i] ?? 1,
  }));

  const totalPrice = await computeTotalPrice(addonOptionsWithQty);

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
      is_made_to_order: data.is_made_to_order,
      preorder_wait_days: data.is_made_to_order ? (data.preorder_wait_days ?? null) : null,
      total_price: totalPrice,
      status: "active",
    })
    .returning({ id: marketplaceListings.id });

  if (addonOptionsWithQty.length > 0) {
    await db.insert(listingAddons).values(
      addonOptionsWithQty.map(({ id, quantity }) => ({
        listing_id: listing.id,
        addon_option_id: id,
        quantity,
      }))
    );
  }

  revalidatePath("/marketplace");
  return { id: listing.id };
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
  const rawQtys = formData.getAll("addon_option_quantities").map((s) => {
    const n = parseInt(String(s), 10);
    return isNaN(n) || n < 1 ? 1 : n;
  });
  const addonOptionsWithQty = data.addon_option_ids.map((id, i) => ({
    id,
    quantity: rawQtys[i] ?? 1,
  }));

  const totalPrice = await computeTotalPrice(addonOptionsWithQty);

  const removeImage = formData.get("remove_image") === "true";
  const newImageUrl = formData.get("display_image_url") as string | null;

  if (removeImage && existing.display_image_url) {
    try { await deleteListingImage(existing.display_image_url); } catch {}
  } else if (newImageUrl && existing.display_image_url && existing.display_image_url !== newImageUrl) {
    try { await deleteListingImage(existing.display_image_url); } catch {}
  }

  // Diff listing_addons
  const currentJoins = await db
    .select({ addon_option_id: listingAddons.addon_option_id, quantity: listingAddons.quantity })
    .from(listingAddons)
    .where(eq(listingAddons.listing_id, id));

  const currentMap = new Map(currentJoins.map((j) => [j.addon_option_id, j.quantity]));
  const newMap = new Map(addonOptionsWithQty.map((a) => [a.id, a.quantity]));

  const toRemove = [...currentMap.keys()].filter((x) => !newMap.has(x));
  const toAdd = [...newMap.entries()].filter(([x]) => !currentMap.has(x));
  const toUpdate = [...newMap.entries()].filter(
    ([x, qty]) => currentMap.has(x) && currentMap.get(x) !== qty
  );

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
      is_made_to_order: data.is_made_to_order,
      preorder_wait_days: data.is_made_to_order ? (data.preorder_wait_days ?? null) : null,
      total_price: totalPrice,
      ...(removeImage ? { display_image_url: null } : newImageUrl ? { display_image_url: newImageUrl } : {}),
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
      toAdd.map(([optionId, quantity]) => ({
        listing_id: id,
        addon_option_id: optionId,
        quantity,
      }))
    );
  }

  for (const [addonId, quantity] of toUpdate) {
    await db
      .update(listingAddons)
      .set({ quantity })
      .where(
        and(
          eq(listingAddons.listing_id, id),
          eq(listingAddons.addon_option_id, addonId)
        )
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

  if (existing.display_image_url) {
    try {
      await deleteListingImage(existing.display_image_url);
    } catch {}
  }

  revalidatePath("/marketplace");
  return { success: true };
}

export async function updateListingImageUrl(listingId: string, url: string) {
  const session = await getSession();

  const [existing] = await db
    .select({ id: marketplaceListings.id })
    .from(marketplaceListings)
    .where(
      and(
        eq(marketplaceListings.id, listingId),
        eq(marketplaceListings.user_id, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Listing not found or access denied" };
  }

  await db
    .update(marketplaceListings)
    .set({ display_image_url: url })
    .where(eq(marketplaceListings.id, listingId));

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/listings/${listingId}`);
  return { success: true };
}

const PAGE_SIZE = 12;

export async function getListings(userId: string, page: number = 1) {
  const offset = (page - 1) * PAGE_SIZE;

  const [listings, totalResult] = await Promise.all([
    db
      .select({
        id: marketplaceListings.id,
        brand: marketplaceListings.brand,
        make: marketplaceListings.make,
        model: marketplaceListings.model,
        variant: marketplaceListings.variant,
        scale: marketplaceListings.scale,
        is_made_to_order: marketplaceListings.is_made_to_order,
        total_price: marketplaceListings.total_price,
        display_image_url: marketplaceListings.display_image_url,
        status: marketplaceListings.status,
        created_at: marketplaceListings.created_at,
        addon_count: count(listingAddons.addon_option_id),
      })
      .from(marketplaceListings)
      .leftJoin(listingAddons, eq(listingAddons.listing_id, marketplaceListings.id))
      .where(eq(marketplaceListings.user_id, userId))
      .groupBy(marketplaceListings.id)
      .orderBy(desc(marketplaceListings.created_at))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.user_id, userId)),
  ]);

  return { listings, total: totalResult[0]?.total ?? 0 };
}

export type ListingWithAddonCount = Awaited<ReturnType<typeof getListings>>["listings"][number];

type AddonOptionWithCategory = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category_id: string;
  category_name: string;
};

type ListingDetailAddonGroup = {
  category_id: string;
  category_name: string;
  options: { id: string; name: string; price: number; quantity: number }[];
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
  is_made_to_order: boolean;
  preorder_wait_days: number | null;
  total_price: number;
  display_image_url: string | null;
  created_at: Date;
  addon_groups: ListingDetailAddonGroup[];
};

export async function bulkUpdateListingStatus(
  listingIds: string[],
  status: ListingStatus
): Promise<{ success: boolean; error?: string }> {
  if (listingIds.length === 0) return { success: true };

  const session = await getSession();
  const userId = session.user.id;

  try {
    await db
      .update(marketplaceListings)
      .set({ status })
      .where(
        and(
          inArray(marketplaceListings.id, listingIds),
          eq(marketplaceListings.user_id, userId)
        )
      );

    const [userRow] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    revalidatePath("/dashboard/marketplace");
    if (userRow) {
      revalidatePath(`/store/${userRow.username}`);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update listing status" };
  }
}

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
      quantity: listingAddons.quantity,
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
      quantity: addon.quantity,
    });
  }

  return {
    ...listing,
    addon_groups: [...groupMap.values()],
  };
}
