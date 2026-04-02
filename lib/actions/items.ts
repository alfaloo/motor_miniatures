"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { itemSchema, ItemFormData } from "@/lib/validations/item";

export async function createItem(formData: ItemFormData) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = itemSchema.safeParse(formData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Validation failed" };
  }

  const data = result.data;

  await db.insert(items).values({
    user_id: session.user.id,
    brand: data.brand,
    make: data.make,
    model: data.model,
    variant: data.variant,
    scale: data.scale,
    serial_number: data.serial_number ?? null,
    production_count: data.production_count ?? null,
    grade: data.grade ?? null,
    purchase_price: data.purchase_price,
    purchase_platform: data.purchase_platform,
    purchase_year: data.purchase_year,
    purchase_month: data.purchase_month,
    is_preorder: data.is_preorder,
    received_year: data.received_year ?? null,
    received_month: data.received_month ?? null,
    is_sold: data.is_sold,
    sold_price: data.sold_price ?? null,
    sold_platform: data.sold_platform ?? null,
    sold_year: data.sold_year ?? null,
    sold_month: data.sold_month ?? null,
    is_wishlist: data.is_wishlist,
  });

  revalidatePath("/");
  revalidatePath("/wishlist");
  const redirectPath = data.is_wishlist ? "/wishlist?toast=item_created" : "/?toast=item_created";
  redirect(redirectPath);
}

export async function updateItem(id: string, formData: ItemFormData) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = itemSchema.safeParse(formData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Validation failed" };
  }

  const existing = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.user_id, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return { error: "Item not found or access denied" };
  }

  const data = result.data;

  const isWishlist = existing[0].is_wishlist;

  await db
    .update(items)
    .set({
      brand: data.brand,
      make: data.make,
      model: data.model,
      variant: data.variant,
      scale: data.scale,
      serial_number: data.serial_number ?? null,
      production_count: data.production_count ?? null,
      grade: data.grade ?? null,
      purchase_price: data.purchase_price,
      purchase_platform: data.purchase_platform,
      purchase_year: data.purchase_year,
      purchase_month: data.purchase_month,
      is_preorder: data.is_preorder,
      received_year: data.received_year ?? null,
      received_month: data.received_month ?? null,
      is_sold: data.is_sold,
      sold_price: data.sold_price ?? null,
      sold_platform: data.sold_platform ?? null,
      sold_year: data.sold_year ?? null,
      sold_month: data.sold_month ?? null,
      is_wishlist: isWishlist,
    })
    .where(eq(items.id, id));

  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath("/items/[id]", "page");
  const redirectPath = isWishlist ? `/wishlist?toast=item_updated` : `/?toast=item_updated`;
  redirect(redirectPath);
}

export async function deleteItem(id: string) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const item = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.user_id, session.user.id)))
    .limit(1);

  if (!item[0]) {
    return { error: "Item not found or access denied" };
  }

  await db.delete(items).where(eq(items.id, id));

  revalidatePath("/");
  return { success: true };
}
