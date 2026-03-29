"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comments, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { commentSchema, CommentFormData } from "@/lib/validations/comment";

export async function createComment(itemId: string, formData: CommentFormData) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = commentSchema.safeParse(formData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Validation failed" };
  }

  const item = await db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.user_id, session.user.id)))
    .limit(1);

  if (!item[0]) {
    return { error: "Item not found or access denied" };
  }

  const data = result.data;

  await db.insert(comments).values({
    user_id: session.user.id,
    item_id: itemId,
    title: data.title,
    description: data.description,
  });

  revalidatePath("/items/[id]", "page");
  return { success: true };
}

export async function updateComment(commentId: string, formData: CommentFormData) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = commentSchema.safeParse(formData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Validation failed" };
  }

  const existing = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.user_id, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return { error: "Comment not found or access denied" };
  }

  const data = result.data;

  await db
    .update(comments)
    .set({
      title: data.title,
      description: data.description,
    })
    .where(eq(comments.id, commentId));

  revalidatePath("/items/[id]", "page");
  return { success: true };
}

export async function deleteComment(commentId: string, itemId: string) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const existing = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.user_id, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return { error: "Comment not found or access denied" };
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath("/items/[id]", "page");
  redirect(`/items/${itemId}?toast=comment_deleted`);
}
