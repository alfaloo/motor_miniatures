"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

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

type FieldResult = "success" | "unchanged" | { error: string };

export async function updateGeneralSettings(
  collectingSinceYear: number,
  monthsLookBack: number,
  topValuesCount: number
): Promise<{
  collectingSinceYear: FieldResult;
  monthsLookBack: FieldResult;
  topValuesCount: FieldResult;
}> {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [current] = await db
    .select({
      collecting_since_year: users.collecting_since_year,
      months_look_back: users.months_look_back,
      top_values_count: users.top_values_count,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const currentYear = new Date().getFullYear();
  const results: {
    collectingSinceYear: FieldResult;
    monthsLookBack: FieldResult;
    topValuesCount: FieldResult;
  } = {
    collectingSinceYear: "unchanged",
    monthsLookBack: "unchanged",
    topValuesCount: "unchanged",
  };

  // Collecting Since Year
  if (collectingSinceYear !== current?.collecting_since_year) {
    if (
      !Number.isInteger(collectingSinceYear) ||
      collectingSinceYear < 1900 ||
      collectingSinceYear > currentYear
    ) {
      results.collectingSinceYear = { error: `Year must be between 1900 and ${currentYear}` };
    } else {
      try {
        await db
          .update(users)
          .set({ collecting_since_year: collectingSinceYear })
          .where(eq(users.id, session.user.id));
        results.collectingSinceYear = "success";
      } catch {
        results.collectingSinceYear = { error: "Failed to save Collecting Since Year" };
      }
    }
  }

  // Months to Look Back
  if (monthsLookBack !== current?.months_look_back) {
    if (
      !Number.isInteger(monthsLookBack) ||
      monthsLookBack < 3 ||
      monthsLookBack > 24
    ) {
      results.monthsLookBack = { error: "Months to look back must be between 3 and 24" };
    } else {
      try {
        await db
          .update(users)
          .set({ months_look_back: monthsLookBack })
          .where(eq(users.id, session.user.id));
        results.monthsLookBack = "success";
      } catch {
        results.monthsLookBack = { error: "Failed to save Months to Look Back" };
      }
    }
  }

  // Top Values to Display
  if (topValuesCount !== current?.top_values_count) {
    if (
      !Number.isInteger(topValuesCount) ||
      topValuesCount < 3 ||
      topValuesCount > 24
    ) {
      results.topValuesCount = { error: "Top values to display must be between 3 and 24" };
    } else {
      try {
        await db
          .update(users)
          .set({ top_values_count: topValuesCount })
          .where(eq(users.id, session.user.id));
        results.topValuesCount = "success";
      } catch {
        results.topValuesCount = { error: "Failed to save Top Values to Display" };
      }
    }
  }

  revalidatePath("/settings");
  return results;
}

export async function updateDisplaySettings(theme: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if (theme !== "dark" && theme !== "light" && theme !== "clock") {
    return { success: false, error: "Invalid theme value" };
  }

  try {
    await db
      .update(users)
      .set({ theme })
      .where(eq(users.id, session.user.id));
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save display settings" };
  }
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

export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if (!currentPassword || !newPassword) {
    return { error: "All password fields are required" };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    return { error: "Current password is incorrect" };
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashed })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  return { success: true };
}
