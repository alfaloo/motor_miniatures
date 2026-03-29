import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import DashboardCharts from "./dashboard-charts";

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function tokenize(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    .filter((token) => token.length > 0);
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all items for the user in one query
  const allItems = await db
    .select()
    .from(items)
    .where(eq(items.user_id, userId));

  // --- Stat cards ---
  const totalPurchaseValue = allItems.reduce(
    (sum, item) => sum + item.purchase_price,
    0
  );
  const totalSoldValue = allItems
    .filter((item) => item.is_sold)
    .reduce((sum, item) => sum + (item.sold_price ?? 0), 0);
  const netSpend = totalPurchaseValue - totalSoldValue;
  const modelsInCollection = allItems.filter((item) => !item.is_sold).length;
  const onPreorder = allItems.filter(
    (item) => item.is_preorder && item.received_year === null
  ).length;

  const stats = [
    { label: "Total Purchase Value", value: formatDollars(totalPurchaseValue) },
    { label: "Total Sold Value", value: formatDollars(totalSoldValue) },
    { label: "Net Spend", value: formatDollars(netSpend) },
    { label: "Models in Collection", value: modelsInCollection.toLocaleString() },
    { label: "On Preorder", value: onPreorder.toLocaleString() },
  ];

  // --- 12-month range ending at current month ---
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12

  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    const label = `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`;
    months.push({ year, month, label });
  }

  // Chart 1: Purchase Value Per Month
  const purchaseValueByMonth = months.map(({ year, month, label }) => {
    const value = allItems
      .filter(
        (item) => item.purchase_year === year && item.purchase_month === month
      )
      .reduce((sum, item) => sum + item.purchase_price, 0);
    return { month: label, value };
  });

  // Chart 2: Models Purchased Per Month
  const modelCountByMonth = months.map(({ year, month, label }) => {
    const count = allItems.filter(
      (item) => item.purchase_year === year && item.purchase_month === month
    ).length;
    return { month: label, count };
  });

  // Chart 3: Top 12 Model Brands in Collection (unsold only)
  const brandCounts = new Map<string, number>();
  allItems
    .filter((item) => !item.is_sold)
    .forEach((item) => {
      const key = item.brand.toLowerCase();
      brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
    });
  const topBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  // Chart 4: Top 12 Car Makes in Collection (unsold only)
  const makeCounts = new Map<string, number>();
  allItems
    .filter((item) => !item.is_sold)
    .forEach((item) => {
      tokenize(item.make).forEach((token) => {
        makeCounts.set(token, (makeCounts.get(token) ?? 0) + 1);
      });
    });
  const topMakes = Array.from(makeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        purchaseValueByMonth={purchaseValueByMonth}
        modelCountByMonth={modelCountByMonth}
        topBrands={topBrands}
        topMakes={topMakes}
      />
    </div>
  );
}
