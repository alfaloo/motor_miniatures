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

  const [user] = await db
    .select({
      collecting_since_year: users.collecting_since_year,
      username: users.username,
      months_look_back: users.months_look_back,
      top_values_count: users.top_values_count,
      theme: users.theme,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const collectingSinceYear = user?.collecting_since_year ?? new Date().getFullYear();
  const username = user?.username ?? "";
  const monthsLookBack = user?.months_look_back ?? 12;
  const topValuesCount = user?.top_values_count ?? 12;
  // Normalise legacy "clock" value to the new "time" option
  const rawTheme = user?.theme ?? "dark";
  const theme = rawTheme === "clock" ? "time" : rawTheme;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      <SettingsForm
        collectingSinceYear={collectingSinceYear}
        monthsLookBack={monthsLookBack}
        topValuesCount={topValuesCount}
        username={username}
        theme={theme}
      />
    </div>
  );
}
