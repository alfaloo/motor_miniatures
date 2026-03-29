import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ItemForm } from "@/components/item-form";

export default async function NewItemPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const userRow = await db
    .select({ collecting_since_year: users.collecting_since_year })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const collectingSinceYear =
    userRow[0]?.collecting_since_year ?? new Date().getFullYear();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Add Item</h1>
      <ItemForm collectingSinceYear={collectingSinceYear} />
    </div>
  );
}
