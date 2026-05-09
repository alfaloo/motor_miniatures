# Spec: Marketplace & Storefront Listing Filter

## Motivation

Vendors and buyers currently have no way to narrow down listings beyond scrolling through the full grid. As a vendor's catalogue grows, finding a specific listing by brand, make, or availability status becomes increasingly tedious. Buyers on the public storefront face the same friction when browsing a large catalogue.

A filter feature already exists on the **Collections** page and is familiar to users. Extending an equivalent experience to the Marketplace (vendor view) and Storefront (public view) removes this friction with minimal learning curve — the interaction model, visual language, and layout remain consistent across all three pages.

---

## Filter Fields

All five filters use **dropdown selects** (not free-text inputs). Every dropdown includes an **Any** option (value `"any"`) that represents "no restriction on this field."

| Field | DB Column | Display Labels |
|---|---|---|
| Brand | `marketplace_listings.brand` | Values as-is (e.g. `Hot Wheels`) |
| Make | `marketplace_listings.make` | Values as-is (e.g. `Porsche`) |
| Scale | `marketplace_listings.scale` | Values as-is (e.g. `1/64`) |
| Availability | `marketplace_listings.is_made_to_order` | `Made to Order` / `Ready Stock` |
| Status | `marketplace_listings.status` | `Active` / `Sold Out` / `Pre-Order` / `Retired` / `Unpublished` |

### Dynamic option population

For the **Marketplace** (vendor view), options for Brand, Make, and Scale are derived from the authenticated user's own listings. For the **Storefront** (public view), options are derived from the vendor's publicly-visible listings (i.e. those whose status passes the vendor's visibility settings). This keeps the dropdown lists relevant — options that would yield zero results never appear.

Status and Availability options are always the full set of possible enum values (they don't need to be dynamically sourced since they're a fixed domain).

---

## Recommended Tech Stack

No new dependencies are required. The implementation reuses every library and pattern already in the codebase:

- **Next.js App Router** — URL search params as the source of truth for filter state (same as Collections)
- **Drizzle ORM** — server-side queries with `and()` + `eq()` / `inArray()` / `isNull()` for filtering, plus `selectDistinct()` for computing dropdown options
- **shadcn/ui `Select`** — already used in `filter-panel.tsx` for dropdowns (Scale, Grade, year/month selects)
- **`useRouter` + `router.push()`** — client-side URL navigation on apply/clear/tag-remove (same as `collection-page-client.tsx`)
- **Tailwind CSS** — amber ring class `ring-2 ring-amber-400 ring-offset-0` (identical to `ACTIVE_FILTER_CLASS` in `filter-panel.tsx`)

---

## Architecture Overview

The feature touches four layers: a new filter panel component, a new page-client wrapper component, updated server actions/queries, and updated page files.

```
components/
  marketplace-filter-panel.tsx     ← new: all-dropdown filter form
  marketplace-page-client.tsx      ← updated: add filter bar + tag strip
app/(dashboard)/marketplace/
  page.tsx                         ← updated: parse filter params, pass to query
app/(store)/store/[username]/
  page.tsx                         ← updated: parse filter params, pass to query
lib/actions/marketplace.ts         ← updated: getListings + getStorefrontListings accept filters
                                      + new: getListingFilterOptions()
```

---

## Detailed Implementation Plan

### 1. Filter options query — `getListingFilterOptions()`

Add a new server action (or co-locate as a plain `async` function) in `lib/actions/marketplace.ts`:

```ts
export async function getListingFilterOptions(userId: string, visibleStatuses?: ListingStatus[]) {
  // Run three selectDistinct queries in parallel:
  //   brands: SELECT DISTINCT brand FROM marketplace_listings WHERE user_id = ? [AND status IN ...]
  //   makes:  SELECT DISTINCT make  FROM marketplace_listings WHERE user_id = ? [AND status IN ...]
  //   scales: SELECT DISTINCT scale FROM marketplace_listings WHERE user_id = ? [AND status IN ...]
  // Return { brands: string[], makes: string[], scales: string[] }
}
```

- For the vendor Marketplace view, call without `visibleStatuses` (show all options regardless of status).
- For the public Storefront view, pass `visibleStatuses` so options only reflect publicly-visible listings.

### 2. Extend `getListings()` and the storefront query to accept filters

**Marketplace** — update `getListings(userId, page)` signature to `getListings(userId, page, filters)`:

```ts
export interface ListingFilterValues {
  brand?: string;
  make?: string;
  scale?: string;
  availability?: "made_to_order" | "ready_stock"; // maps to is_made_to_order boolean
  status?: ListingStatus;
}
```

Build a Drizzle `and(...)` condition array from whichever filter fields are present and pass it to `.where()`. Filters with value `"any"` or `undefined` are skipped.

**Storefront** — apply the same `filters` argument to the inline `StorefrontGrid` query in `app/(store)/store/[username]/page.tsx`. The existing `inArray(status, visibleStatuses)` condition stays in place; the filter conditions are composed alongside it using `and()`.

### 3. `MarketplaceFilterPanel` component — `components/marketplace-filter-panel.tsx`

A new client component that mirrors the structure of `FilterPanel` but is simpler — all five fields use `<Select>` (no `<Input>` fields):

```tsx
"use client";

export interface MarketplaceFilterValues {
  brand?: string;
  make?: string;
  scale?: string;
  availability?: string;   // "made_to_order" | "ready_stock"
  status?: string;         // ListingStatus value
}

interface MarketplaceFilterPanelProps {
  isOpen: boolean;
  activeFilters: MarketplaceFilterValues;
  options: { brands: string[]; makes: string[]; scales: string[] };
  onApply: (filters: MarketplaceFilterValues) => void;
  onClear: () => void;
}
```

**Internal state** — same pattern as `FilterPanel`: `const [values, setValues] = useState({ ...activeFilters })` re-synced via `useEffect` when `isOpen` changes.

**Layout** — a single flat grid (no accordion sections needed, only 5 fields):

```
<div className="bg-card border border-border rounded-xl p-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    Brand select
    Make select
    Scale select
    Availability select
    Status select
  </div>
  <div className="flex gap-3 pt-4">
    Apply button (blue)
    Clear button (outline)
  </div>
</div>
```

**Active field highlighting** — apply `ring-2 ring-amber-400 ring-offset-0` to the `<SelectTrigger>` when its value is active (not `"any"` and not `undefined`/`""`). Reuse the same `isActive()` helper:

```ts
const ACTIVE_FILTER_CLASS = "ring-2 ring-amber-400 ring-offset-0";
function isActive(v: string | undefined) { return Boolean(v && v !== "any" && v !== ""); }
```

**Availability options** — hardcoded:
- `any` → Any
- `ready_stock` → Ready Stock
- `made_to_order` → Made to Order

**Status options** — hardcoded from the `ListingStatus` enum:
- `any` → Any
- `active` → Active
- `sold_out` → Sold Out
- `pre_order` → Pre-Order
- `retired` → Retired
- `unpublished` → Unpublished

> Note: On the public Storefront, Status is **not** shown as a filter option (statuses are already controlled by the vendor's visibility settings; showing a Status filter to buyers would expose the existence of e.g. `unpublished` listings). Availability remains a valid public filter.

### 4. `MarketplacePageClient` update — `components/marketplace-page-client.tsx`

Currently this component manages selection state and the Configure panel. Extend it to also own the filter bar, mirroring `CollectionPageClient`:

**New props:**

```ts
interface MarketplacePageClientProps {
  // existing...
  username: string;
  configPanel: React.ReactNode;
  // new:
  activeFilters: MarketplaceFilterValues;
  filterOptions: { brands: string[]; makes: string[]; scales: string[] };
  searchParams: Record<string, string>;
}
```

**New state:** `const [filterOpen, setFilterOpen] = useState(false)`

**Filter bar placement** — insert between the existing action row (Select / New listing buttons) and the listings grid (children):

```
[existing action row: Select | Share | New listing | Configure]
[filter tag strip — visible when panel is closed and filters are active]
[MarketplaceFilterPanel — visible when filterOpen]
[children (listings grid)]
```

**Filter button** — add alongside the existing buttons in the action row:

```tsx
<Button variant="outline" onClick={() => setFilterOpen(p => !p)}
  className="h-9 bg-card border-border text-foreground hover:bg-secondary">
  <Filter className="h-4 w-4" />
  <span className="hidden sm:inline">Filter</span>
  {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
</Button>
```

**`buildFilterUrl()` helper** — identical pattern to `CollectionPageClient.buildFilterUrl()`: constructs `URLSearchParams` preserving `page` reset and any existing non-filter params, serialises active filters as query params:

```ts
function buildFilterUrl(filters: MarketplaceFilterValues): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (isActive(v)) params.set(k, v!);
  }
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}
```

**`handleApply`** — calls `router.push(buildFilterUrl(values))` then closes the panel.

**`handleClear`** — calls `router.push("/marketplace")` then closes the panel.

**Filter tag strip** — identical implementation to `CollectionPageClient`: shown when `!filterOpen && hasActiveFilters`. Each tag renders `label × ` and calls `handleRemoveTag(key)` on click:

```tsx
const FILTER_KEY_LABELS: { key: keyof MarketplaceFilterValues; label: string }[] = [
  { key: "brand",        label: "Brand"        },
  { key: "make",         label: "Make"         },
  { key: "scale",        label: "Scale"        },
  { key: "availability", label: "Availability" },
  { key: "status",       label: "Status"       },
];
```

Tag styling — reuse exactly: `inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-xs rounded-md border border-border`

### 5. Storefront filter bar — inline in `app/(store)/store/[username]/page.tsx`

The storefront is a server-side page with no existing client wrapper. Two approaches are possible:

**Option A (recommended) — create `StorefrontPageClient`**: A thin new client component (`components/storefront-page-client.tsx`) that owns only the filter bar state (open/closed) and URL navigation. The storefront page passes it `activeFilters` and `filterOptions` as props, the `StorefrontGrid` remains a server component (Suspense-wrapped) rendered as `children`. This mirrors how `MarketplacePageClient` wraps `ListingsGrid`.

**Option B** — embed the filter bar directly as a client island. Slightly more coupling but avoids a new file.

Option A is consistent with the existing architectural pattern and is preferred.

The `StorefrontPageClient` renders:
- A filter button (same design)
- The tag strip
- `MarketplaceFilterPanel` (reused — same component, pass `showStatus={false}` prop to hide the Status field on the public storefront)
- `children` (the grid)

On the storefront, `buildFilterUrl()` should target `/store/[username]` as the base path.

### 6. Page-level wiring

**`app/(dashboard)/marketplace/page.tsx`:**

```ts
// Parse filter params from searchParams
const filters: ListingFilterValues = {
  brand:        params.brand        || undefined,
  make:         params.make         || undefined,
  scale:        params.scale        || undefined,
  availability: params.availability || undefined,
  status:       params.status       || undefined,
};

// Fetch filter options (parallel with listings)
const [filterOptions] = await Promise.all([
  getListingFilterOptions(session.user.id),
]);

// Pass to MarketplacePageClient and ListingsGrid
```

**`app/(store)/store/[username]/page.tsx`:**

```ts
const filters: ListingFilterValues = { ... }; // same parse

const filterOptions = await getListingFilterOptions(userRow.id, visibleStatuses);

// Pass to StorefrontPageClient
```

---

## URL Shape

Filters are encoded as plain query parameters (same as Collections):

```
/marketplace?brand=Hot+Wheels&scale=1%2F64
/store/vendorname?make=Porsche&availability=ready_stock
```

Pagination resets to page 1 whenever a filter is applied (omit `page` param in `buildFilterUrl`).

---

## Interaction Behaviour Summary

| Action | Result |
|---|---|
| Open filter panel | Panel slides in below action bar |
| Change dropdown to non-Any value | `SelectTrigger` gains amber ring immediately (local state) |
| Click Apply | Panel closes, URL updated, page re-renders with filtered grid |
| Click Clear | All dropdowns reset to Any, panel closes, URL cleared of filter params |
| Click tag × | That filter removed from URL; remaining filters preserved |
| Filter panel open | Tag strip hidden (panel itself shows current selections) |
| Filter panel closed + active filters | Tag strip visible above grid |

---

## What Is Not In Scope

- **Sorting** — the Collections page has sort controls; the Marketplace/Storefront do not currently and this spec does not add them.
- **Price range filter** — not requested; can be added in a future spec.
- **Persisting filters across sessions** — URL params are sufficient; localStorage persistence is not needed.
- **Filter result counts** — the Collections page shows a "Matched Items" summary bar. This is omitted here to keep the implementation simpler; it can be added later.
