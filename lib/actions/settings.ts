"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserSettings(collectingSinceYear: number) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(collectingSinceYear) ||
    collectingSinceYear < 1900 ||
    collectingSinceYear > currentYear
  ) {
    return { error: `Year must be between 1900 and ${currentYear}` };
  }

  await db
    .update(users)
    .set({ collecting_since_year: collectingSinceYear })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  return { success: true };
}
