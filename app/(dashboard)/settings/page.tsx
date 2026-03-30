import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const user = await db
    .select({ collecting_since_year: users.collecting_since_year, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const collectingSinceYear = user[0]?.collecting_since_year ?? new Date().getFullYear();
  const username = user[0]?.username ?? "";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Settings</h1>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <SettingsForm collectingSinceYear={collectingSinceYear} username={username} />
      </div>
    </div>
  );
}
