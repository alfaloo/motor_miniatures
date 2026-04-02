import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { ThemeInitializer } from "@/components/theme-initializer";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const [user] = await db
    .select({ theme: users.theme })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const userTheme = user?.theme ?? "dark";

  return (
    <div className="min-h-screen bg-background">
      <ThemeInitializer userTheme={userTheme} />
      <Navbar username={session.user.username} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
