import { and, eq, ilike, isNull } from "drizzle-orm";
import { items } from "@/db/schema";
import type { FilterValues } from "@/components/filter-panel";

export const FILTER_KEYS = [
  "brand", "make", "model", "variant", "scale", "grade",
  "serial_number", "production_count", "purchase_platform", "purchase_price",
  "purchase_year", "purchase_month", "is_preorder", "received_year", "received_month",
  "is_sold", "sold_price", "sold_platform", "sold_year", "sold_month",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export function isActiveFilter(val: string | undefined): boolean {
  return Boolean(val && val !== "" && val !== "any");
}

export function hasActiveFilters(searchParams: Record<string, string>): boolean {
  return FILTER_KEYS.some((k) => isActiveFilter(searchParams[k]));
}

export function extractActiveFilters(searchParams: Record<string, string>): FilterValues {
  const result: FilterValues = {};
  for (const key of FILTER_KEYS) {
    const val = searchParams[key];
    if (isActiveFilter(val)) {
      (result as Record<string, string>)[key] = val!;
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildItemWhereConditions(searchParams: Record<string, string>, userId: string, isWishlist?: boolean): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [eq(items.user_id, userId)];
  if (isWishlist !== undefined) conditions.push(eq(items.is_wishlist, isWishlist));
  const fp = searchParams;

  if (isActiveFilter(fp.brand)) conditions.push(ilike(items.brand, `%${fp.brand}%`));
  if (isActiveFilter(fp.make)) conditions.push(ilike(items.make, `%${fp.make}%`));
  if (isActiveFilter(fp.model)) conditions.push(ilike(items.model, `%${fp.model}%`));
  if (isActiveFilter(fp.variant)) conditions.push(ilike(items.variant, `%${fp.variant}%`));
  if (isActiveFilter(fp.scale)) conditions.push(eq(items.scale, fp.scale!));
  if (isActiveFilter(fp.grade)) {
    if (fp.grade === "ungraded") {
      conditions.push(isNull(items.grade));
    } else {
      const g = parseInt(fp.grade!, 10);
      if (!isNaN(g)) conditions.push(eq(items.grade, g));
    }
  }
  if (isActiveFilter(fp.serial_number)) {
    const v = parseInt(fp.serial_number!, 10);
    if (!isNaN(v)) conditions.push(eq(items.serial_number, v));
  }
  if (isActiveFilter(fp.production_count)) {
    const v = parseInt(fp.production_count!, 10);
    if (!isNaN(v)) conditions.push(eq(items.production_count, v));
  }
  if (isActiveFilter(fp.purchase_platform))
    conditions.push(ilike(items.purchase_platform, `%${fp.purchase_platform}%`));
  if (isActiveFilter(fp.purchase_price)) {
    const v = parseInt(fp.purchase_price!, 10);
    if (!isNaN(v)) conditions.push(eq(items.purchase_price, v));
  }
  if (isActiveFilter(fp.purchase_year)) {
    const v = parseInt(fp.purchase_year!, 10);
    if (!isNaN(v)) conditions.push(eq(items.purchase_year, v));
  }
  if (isActiveFilter(fp.purchase_month)) {
    const v = parseInt(fp.purchase_month!, 10);
    if (!isNaN(v)) conditions.push(eq(items.purchase_month, v));
  }
  if (isActiveFilter(fp.is_preorder)) {
    conditions.push(eq(items.is_preorder, fp.is_preorder === "yes"));
  }
  if (isActiveFilter(fp.received_year)) {
    const v = parseInt(fp.received_year!, 10);
    if (!isNaN(v)) conditions.push(eq(items.received_year, v));
  }
  if (isActiveFilter(fp.received_month)) {
    const v = parseInt(fp.received_month!, 10);
    if (!isNaN(v)) conditions.push(eq(items.received_month, v));
  }
  if (isActiveFilter(fp.is_sold)) {
    conditions.push(eq(items.is_sold, fp.is_sold === "yes"));
  }
  if (isActiveFilter(fp.sold_price)) {
    const v = parseInt(fp.sold_price!, 10);
    if (!isNaN(v)) conditions.push(eq(items.sold_price, v));
  }
  if (isActiveFilter(fp.sold_platform))
    conditions.push(ilike(items.sold_platform, `%${fp.sold_platform}%`));
  if (isActiveFilter(fp.sold_year)) {
    const v = parseInt(fp.sold_year!, 10);
    if (!isNaN(v)) conditions.push(eq(items.sold_year, v));
  }
  if (isActiveFilter(fp.sold_month)) {
    const v = parseInt(fp.sold_month!, 10);
    if (!isNaN(v)) conditions.push(eq(items.sold_month, v));
  }

  return conditions;
}

// Helper used in buildItemWhereConditions — re-exported for convenience
export { and };
