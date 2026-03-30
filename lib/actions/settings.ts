"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
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

export async function updateUsername(newUsername: string) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const trimmed = newUsername.trim();

  if (!trimmed) {
    return { error: "Username cannot be empty" };
  }

  if (trimmed.length > 32) {
    return { error: "Username must be 32 characters or fewer" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, trimmed), ne(users.id, session.user.id)))
    .limit(1);

  if (existing.length > 0) {
    return { error: "That username is already taken. Please choose another." };
  }

  await db
    .update(users)
    .set({ username: trimmed })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  return { success: true };
}
