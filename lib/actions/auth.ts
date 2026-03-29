"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/lib/auth";

type RegisterResult = {
  errors?: {
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
};

export async function registerUser(
  prevState: RegisterResult,
  formData: FormData
): Promise<RegisterResult> {
  const username = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  const errors: RegisterResult["errors"] = {};

  // Validate username: 3–32 chars, alphanumeric + underscores only
  if (username.length < 3 || username.length > 32) {
    errors.username = "Username must be between 3 and 32 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username =
      "Username may only contain letters, numbers, and underscores.";
  }

  // Validate password: min 8 chars
  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  // Validate confirm password
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert user
  try {
    await db.insert(users).values({
      username,
      password: hashedPassword,
      collecting_since_year: new Date().getFullYear(),
    });
  } catch (error: unknown) {
    // Handle duplicate username (PostgreSQL unique constraint violation code 23505)
    const err = error as { code?: string };
    if (err?.code === "23505") {
      return { errors: { username: "Username is already taken." } };
    }
    return { errors: { general: "An unexpected error occurred. Please try again." } };
  }

  redirect("/login");
}

type LoginResult = {
  error?: string;
};

export async function loginUser(
  prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const username = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid username or password." };
    }
    throw error; // Re-throw redirect errors so Next.js can handle them
  }

  return {};
}
