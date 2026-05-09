"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface StorefrontVisibilitySettings {
  storefront_show_active: boolean;
  storefront_show_pre_order: boolean;
  storefront_show_sold_out: boolean;
  storefront_show_retired: boolean;
  storefront_show_unpublished: boolean;
}

export async function updateStorefrontVisibility(settings: StorefrontVisibilitySettings) {
  const session = await auth();
  if (!session) redirect("/login");

  await db
    .update(users)
    .set(settings)
    .where(eq(users.id, session.user.id));

  revalidatePath("/marketplace");
  return { success: true };
}
