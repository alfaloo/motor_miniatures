# Marketplace Feature Specification

## Table of Contents

1. [Motivation](#motivation)
2. [Feature Overview](#feature-overview)
3. [Scope & Boundaries](#scope--boundaries)
4. [User Roles](#user-roles)
5. [Data Model](#data-model)
6. [Page & Route Architecture](#page--route-architecture)
7. [Feature Breakdown](#feature-breakdown)
   - [Add-On Configuration](#1-add-on-configuration)
   - [Marketplace Listings (Vendor View)](#2-marketplace-listings-vendor-view)
   - [Create / Edit Listing Form](#3-create--edit-listing-form)
   - [Listing Detail View (Vendor)](#4-listing-detail-view-vendor)
   - [Public Storefront](#5-public-storefront)
   - [Public Listing Detail](#6-public-listing-detail)
   - [Share Link](#7-share-link)
8. [Propagation & Cascade Logic](#propagation--cascade-logic)
9. [UI & Styling Conventions](#ui--styling-conventions)
10. [Implementation Plan](#implementation-plan)

---

## Motivation

Motor Miniatures currently supports collecting and tracking model cars through the Collection, Wishlist, and Dashboard pages. The app handles purchasing, grading, and monitoring a personal collection well.

A natural extension of the hobby is **customising and selling** model cars — particularly Hot Wheels customs. Common customisations include wheel swaps, repaints, decals, lighting mods, and clear-coat finishing. Each customisation is a discrete add-on with its own cost, and a finished custom is priced as the sum of all its add-ons.

To facilitate this side hustle, a **Marketplace** feature is needed. It serves two distinct audiences:

- **The vendor (app owner):** Needs a way to define and manage add-on pricing, build listings that reference those add-ons, and share a public link with buyers.
- **Prospective buyers:** Need a clean, read-only view of available listings that requires no login and is presentable enough to share via social media or DMs.

The Marketplace must feel native to the existing app: same card-panel layout, same skeleton-loading pattern, same theme system, and same server-action data layer.

---

## Feature Overview

| Capability | Who | Where |
|---|---|---|
| Define add-on categories & options with prices | Vendor | `/marketplace` (vendor view) |
| Edit / delete add-on options | Vendor | `/marketplace` (vendor view) |
| Create custom car listings referencing add-ons | Vendor | `/marketplace/listings/new` |
| Edit / delete listings | Vendor | `/marketplace/listings/[id]/edit` |
| View listing detail with price breakdown | Vendor | `/marketplace/listings/[id]` |
| View all listings (panel grid) | Vendor | `/marketplace` |
| Get shareable public storefront link | Vendor | `/marketplace` (share modal) |
| Browse all listings (public, no login) | Buyer | `/store/[username]` |
| View listing detail (public, no login) | Buyer | `/store/[username]/[id]` |

---

## Scope & Boundaries

**In scope:**
- Add-on category and option CRUD (vendor only)
- Marketplace listing CRUD with add-on selection (vendor only)
- Auto-computed total price from selected add-ons
- Propagation of add-on price/name changes to all affected listings
- Cascade delete warning for add-ons used in active listings
- Public storefront accessible without login
- Share modal with copy-to-clipboard link
- Consistent UI with existing Collection page (card grid, skeletons, detail view)

**Out of scope (for this iteration):**
- Checkout / payment processing
- Direct buyer–seller messaging
- Order management or fulfilment tracking
- Inventory / stock counts
- Images or photo uploads for listings
- Search or filtering on the public storefront

---

## User Roles

### Vendor
The authenticated app user. Has full CRUD access to add-on configuration and listings. Identified by `session.user.id` and `session.user.username` (existing NextAuth session).

### Buyer
Any unauthenticated (or authenticated non-owner) visitor who navigates to the public storefront URL `/store/[username]`. Sees listings in read-only mode. No login required. Even if a buyer happens to have an account, they are shown the buyer view — the vendor-specific UI is never exposed on this route.

---

## Data Model

Three new database tables are required. All use UUID primary keys (consistent with `users` and `items`).

### `addon_categories`

Organises add-ons into named groups (e.g., "Basic", "Paint Job", "Decals").

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users.id` | Cascade delete |
| `name` | VARCHAR(64) | e.g., "Paint Job" |
| `created_at` | TIMESTAMP | |

Index: `addon_categories_user_id_idx` on `user_id`.

### `addon_options`

Specific purchasable options within a category, each with a price in cents.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `category_id` | UUID FK → `addon_categories.id` | Cascade delete |
| `user_id` | UUID FK → `users.id` | Cascade delete; denormalised for efficient querying |
| `name` | VARCHAR(64) | e.g., "Wheel Swap" |
| `price` | INTEGER | Cents, non-negative |
| `created_at` | TIMESTAMP | |

Index: `addon_options_category_id_idx`, `addon_options_user_id_idx`.

### `marketplace_listings`

A custom car for sale. Price is stored as a computed snapshot and recalculated whenever linked add-ons change.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users.id` | Cascade delete |
| `brand` | VARCHAR(32) | e.g., "Hot Wheels" |
| `make` | VARCHAR(32) | e.g., "Ferrari" |
| `model` | VARCHAR(64) | Model name |
| `variant` | VARCHAR(128) | Variant / colour |
| `scale` | VARCHAR(8) | `"1/18"` \| `"1/24"` \| `"1/43"` \| `"1/64"` |
| `production_count` | INTEGER (nullable) | |
| `description` | TEXT (nullable) | Free-form notes about the custom |
| `is_preorder` | BOOLEAN | default `false` |
| `base_price` | INTEGER | Cents; vendor-set base price before add-ons |
| `total_price` | INTEGER | Cents; recomputed = base_price + Σ add-on prices |
| `created_at` | TIMESTAMP | |

Index: `marketplace_listings_user_id_idx`.

### `listing_addons` (join table)

Links a listing to the specific add-on options it includes.

| Column | Type | Notes |
|---|---|---|
| `listing_id` | UUID FK → `marketplace_listings.id` | Cascade delete |
| `addon_option_id` | UUID FK → `addon_options.id` | Restricted delete (guarded by warning) |

Composite PK: `(listing_id, addon_option_id)`.

---

## Page & Route Architecture

New routes are added inside the existing `(dashboard)` group (for vendor pages) and a new top-level `(store)` group (for the public storefront).

```
app/
├── (dashboard)/
│   ├── marketplace/
│   │   ├── page.tsx                  # Vendor: listings grid + add-on config panel
│   │   └── listings/
│   │       ├── new/
│   │       │   └── page.tsx          # Vendor: create listing form
│   │       └── [id]/
│   │           ├── page.tsx          # Vendor: listing detail
│   │           └── edit/
│   │               └── page.tsx      # Vendor: edit listing form
│
├── (store)/
│   ├── layout.tsx                    # Minimal layout: no navbar, no auth guard
│   └── store/
│       └── [username]/
│           ├── page.tsx              # Public: storefront listings grid
│           └── [id]/
│               └── page.tsx          # Public: public listing detail

lib/
├── actions/
│   ├── marketplace.ts                # Server actions: listing CRUD, add-on CRUD
│   └── addons.ts                     # Server actions: category/option CRUD
├── validations/
│   ├── listing.ts                    # Zod schema for listing form
│   └── addon.ts                      # Zod schema for category + option forms

db/
└── schema.ts                         # + four new table definitions

components/
├── marketplace-listing-card.tsx      # Card panel for a listing (vendor + buyer)
├── marketplace-listing-skeleton.tsx  # Skeleton loader for listing grid
├── listing-form.tsx                  # Create/edit listing form
├── addon-config-panel.tsx            # Accordion-style add-on category manager
├── addon-category-row.tsx            # Inline edit/delete for a category
├── addon-option-row.tsx              # Inline edit/delete for an option
├── addon-delete-warning.tsx          # Modal: lists affected listings before delete
├── share-link-modal.tsx              # Modal: shows public URL + copy button
└── marketplace-page-client.tsx       # Client state wrapper for the vendor page
```

---

## Feature Breakdown

### 1. Add-On Configuration

**Location:** Rendered as a collapsible/accordion section at the top of `/marketplace` (vendor view), toggled by a "Configure Add-Ons" button.

**Behaviour:**

- Categories are displayed as labelled accordion panels.
- Each category shows its options in a list beneath it.
- Inline forms allow creating a new category (just a name field) or a new option under a category (name + price fields).
- An **"Add option"** affordance sits at the bottom of each category's option list.
- An **"Add category"** affordance sits at the bottom of the categories list.

**Editing:**

- Clicking the edit icon on a category or option replaces the static text with an inline editable field (category: name only; option: name + price).
- Saving triggers a server action that updates the row, then propagates changes — see [Propagation & Cascade Logic](#propagation--cascade-logic).
- Cancel restores the previous display without saving.

**Deleting:**

- Clicking the delete icon checks server-side whether the option is referenced by any active listing.
- **If no listings are affected:** Delete proceeds immediately; a success toast confirms.
- **If one or more listings are affected:** An `addon-delete-warning` modal opens, listing all affected listing titles with links. The modal has a **Back** button and a **Confirm Delete** button. On confirm, the add-on is forcibly removed from all linked listings (`listing_addons` rows deleted), `total_price` is recomputed for each affected listing, and then the option row is deleted.
- Deleting a category that still has options triggers the same warning logic aggregated across all options in that category.

**Validation:**
- Category name: required, max 64 chars.
- Option name: required, max 64 chars.
- Option price: required, non-negative integer (entered in whole currency units, stored as cents).

---

### 2. Marketplace Listings (Vendor View)

**Location:** `/marketplace` — below the add-on config section.

**Layout:** Identical responsive grid to the Collection page:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
```

**Card Content (`marketplace-listing-card.tsx`):**
- Brand + Make + Model + Variant as heading
- Scale badge
- "Pre-order" amber badge if `is_preorder = true`
- Total price displayed prominently (e.g., `$42.00`)
- Edit and Delete action buttons (vendor view only; hidden in buyer view)

**Skeleton Loading:**
- `marketplace-listing-skeleton.tsx` mirrors `item-card-skeleton.tsx` with `animate-pulse` blocks matching card layout.
- 8 skeletons shown while data loads via Suspense.

**Empty State:**
- Centred `Tag` icon (Lucide) with "No listings yet" message and a link to create the first one.

**Top Bar:**
- Page heading "Marketplace"
- **"Share storefront"** button (opens share modal) — right-aligned
- **"New listing"** button — right-aligned next to share button

---

### 3. Create / Edit Listing Form

**Location:** `/marketplace/listings/new` and `/marketplace/listings/[id]/edit`.

**Form Fields:**

| Field | Type | Notes |
|---|---|---|
| Brand | Text input | e.g., "Hot Wheels" |
| Make | Text input | e.g., "Ferrari" |
| Model | Text input | |
| Variant | Text input | |
| Scale | Select | Same options as collection: 1/18, 1/24, 1/43, 1/64 |
| Production Count | Number input | Optional |
| Description | Textarea | Optional; free-form custom notes |
| Is Pre-order | Checkbox / toggle | |
| Base Price | Number input | Vendor's base price in whole currency units |

**Add-On Selection:**

- A dedicated section below the main fields: "Add-ons included".
- Add-ons are grouped visually by category (accordion or flat grouped list).
- Each option shows a checkbox, its name, and its price.
- Checking an option adds it to the listing; unchecking removes it.
- **"Create add-on on the go":** A small inline form at the bottom of the add-on section allows creating a new category or option without navigating away. On save, the new option appears immediately in the list and is checked automatically.
- A running **"Total price"** subtotal is shown live: `base price + Σ checked add-on prices`, updating as the user checks/unchecks options.

**Submission:**
- Server action validates with Zod, writes `marketplace_listings` row, writes `listing_addons` join rows, computes and stores `total_price`.
- On success, redirect to `/marketplace` with `?toast=listing_created` (or `listing_updated`).
- On error, return inline field errors (same pattern as `item-form.tsx`).

---

### 4. Listing Detail View (Vendor)

**Location:** `/marketplace/listings/[id]`.

**Layout:** Single-column detail view (similar to `/items/[id]`).

**Content:**

- **Header block:** Brand / Make / Model / Variant as a large heading. Scale badge and Pre-order badge if applicable.
- **Attributes table:**
  - Scale
  - Production count (shown only if set)
  - Status: "Pre-order" or "Ready Stock"
- **Description block:** If `description` is set, display it in a card with a "Notes" heading.
- **Price breakdown card:**
  - Base price line item
  - Each add-on grouped under its parent category heading:
    ```
    Basic
      Derivet               $3.00
      Wheel Swap            $5.00
    Paint Job
      Gloss Black Primer    $5.00
      Metallic Silver       $5.00
      Clear Coat            $5.00
    ────────────────────────────
    Total                  $28.00
    ```
  - Styled with `bg-card border border-border rounded-xl p-4 sm:p-6`.
- **Edit / Delete** buttons in the top-right corner of the page header.

---

### 5. Public Storefront

**Location:** `/store/[username]` — served from the `(store)` group layout.

**Layout:**
- Completely separate from the `(dashboard)` layout. No navbar, no auth guard, no settings UI.
- Minimal header: site name / logo, and the vendor's username (e.g., "alfaloo's Customs").
- No login prompt or redirect — fully public.
- Even if a logged-in user navigates here, they see only the buyer view.

**Content:**
- Same responsive card grid as the vendor view.
- Cards are identical to `marketplace-listing-card.tsx` but rendered without vendor action buttons (Edit/Delete).
- Clicking a card navigates to `/store/[username]/[id]`.

**Empty State:**
- Centred icon + "No listings available right now."

**Loading:**
- Same skeleton grid (8 cards) via Suspense.

---

### 6. Public Listing Detail

**Location:** `/store/[username]/[id]`.

**Content:** Identical to the vendor detail view (Section 4) but without Edit/Delete buttons and without any navigation back to the dashboard.

- Back link: "← Back to [username]'s store" returning to `/store/[username]`.

---

### 7. Share Link

**Trigger:** "Share storefront" button on the vendor's `/marketplace` page.

**Modal (`share-link-modal.tsx`):**
- Dialog with title "Your storefront link".
- Read-only text input showing the full URL: `https://<domain>/store/<username>`.
- **"Copy link"** button: copies URL to clipboard via `navigator.clipboard.writeText`, button label briefly changes to "Copied!" with a green check icon.
- Dismiss button (X) to close.

The URL is deterministic and permanent — it is derived from `session.user.username` and requires no database lookup to construct. The username is immutable in the current schema, so the link never breaks.

---

## Propagation & Cascade Logic

### When an add-on option is edited (name or price change):

1. Update the `addon_options` row.
2. Find all `listing_addons` rows that reference this `addon_option_id`.
3. For each affected listing, recompute `total_price`:
   ```
   total_price = base_price + SUM(price of all linked addon_options)
   ```
4. Update each affected `marketplace_listings` row's `total_price`.
5. Revalidate `/marketplace` and all affected `/marketplace/listings/[id]` paths.

All steps run in a single database transaction.

### When a category name is edited:

- Only the `addon_categories` row is updated. No listing prices are affected.

### When an add-on option is deleted (no active listings):

1. Delete the `addon_options` row (cascades `listing_addons` rows via FK, but there are none).
2. Revalidate `/marketplace`.

### When an add-on option is deleted (active listings exist):

1. Show `addon-delete-warning` modal listing affected listings.
2. On confirm:
   a. Delete all `listing_addons` rows for this `addon_option_id`.
   b. Recompute `total_price` for each previously affected listing.
   c. Delete the `addon_options` row.
   d. Revalidate `/marketplace` and affected detail pages.

### When a category is deleted:

- Treated as deleting all its options in sequence. The warning modal aggregates all affected listings across all options in the category and presents them in a single list.

---

## UI & Styling Conventions

All new components must adhere to the conventions already established in the codebase.

| Convention | Standard |
|---|---|
| Card container | `bg-card border border-border rounded-xl p-4 sm:p-6` |
| Grid layout | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4` |
| Skeleton loader | `animate-pulse` blocks using `bg-secondary` via `Skeleton` component |
| Badge — Pre-order | `bg-amber-600 text-white` (same as collection) |
| Badge — Ready Stock | `bg-green-600 text-white` |
| Badge — Scale | `bg-blue-600 text-white` |
| Destructive button | `border-red-900 bg-secondary hover:bg-red-900/30 text-red-400` |
| Modals | Radix `Dialog` component (consistent with existing delete confirmations) |
| Toast | Sonner via `?toast=` query param pattern + `ToastOnMount` |
| Form structure | React Hook Form + Zod + `useActionState` server action pattern |
| Auth guard | `const session = await auth()` at top of server component; redirect if null |
| Empty state | Lucide icon centred, muted text, CTA link |
| Spacing | `gap-4`, `p-4 sm:p-6` throughout |

---

## Implementation Plan

The implementation is broken into sequential milestones. Each milestone is independently shippable.

---

### Milestone 1 — Database Schema

**Goal:** Extend Drizzle schema and run migration.

**Tasks:**
1. Add `addon_categories`, `addon_options`, `marketplace_listings`, and `listing_addons` table definitions to `/db/schema.ts`.
2. Add appropriate FK constraints, cascade rules, and indexes.
3. Generate and run the Drizzle migration (`npm run db:migrate` or equivalent).
4. Export new table types from schema for use in server actions.

**Deliverable:** Database tables exist; no UI changes yet.

---

### Milestone 2 — Add-On Configuration (Vendor)

**Goal:** Vendors can create, edit, and delete add-on categories and options.

**Tasks:**
1. Write Zod validation schemas in `/lib/validations/addon.ts` (category: name; option: name + price).
2. Write server actions in `/lib/actions/addons.ts`:
   - `createCategory(name)` → inserts `addon_categories` row
   - `updateCategory(id, name)` → updates row
   - `deleteCategory(id)` → checks for affected listings across all options, returns list or deletes
   - `createOption(categoryId, name, price)` → inserts `addon_options` row
   - `updateOption(id, name, price)` → updates row + propagates `total_price` changes
   - `deleteOption(id)` → checks affected listings, returns list or deletes + recomputes prices
3. Build `addon-config-panel.tsx`:
   - Fetches categories + options via server component
   - Inline add/edit/delete for categories
   - Inline add/edit/delete for options within each category
4. Build `addon-delete-warning.tsx` modal.
5. Wire up the config panel to the `/marketplace` page as a collapsible section (placeholder listing grid for now).

**Deliverable:** Vendors can fully manage add-on categories and options.

---

### Milestone 3 — Marketplace Listings (Vendor)

**Goal:** Vendors can create, view, edit, and delete listings.

**Tasks:**
1. Write Zod schema in `/lib/validations/listing.ts`.
2. Write server actions in `/lib/actions/marketplace.ts`:
   - `createListing(formData)` → inserts listing + `listing_addons` rows + computes `total_price`
   - `updateListing(id, formData)` → updates listing + diffs `listing_addons` + recomputes `total_price`
   - `deleteListing(id)` → deletes listing (cascades join rows)
   - `getListings(userId)` → returns listings with add-on counts for grid
   - `getListingDetail(id)` → returns listing + add-ons grouped by category
3. Build `marketplace-listing-card.tsx` and `marketplace-listing-skeleton.tsx`.
4. Build `listing-form.tsx` with add-on selection section and live total display.
5. Build the listing detail page component with price breakdown table.
6. Wire up pages:
   - `/marketplace` — listings grid + new listing button
   - `/marketplace/listings/new` — create form
   - `/marketplace/listings/[id]` — detail view
   - `/marketplace/listings/[id]/edit` — edit form
7. Add "Marketplace" link to the navbar (existing `navbar.tsx`).

**Deliverable:** Full vendor-side marketplace is functional.

---

### Milestone 4 — Public Storefront

**Goal:** Buyers can view listings at a permanent public URL.

**Tasks:**
1. Create `(store)` route group with a minimal `layout.tsx` (no navbar, no auth guard).
2. Build `/store/[username]/page.tsx`:
   - Look up `user.id` by `username` from DB.
   - Fetch listings for that user.
   - Render card grid using `marketplace-listing-card.tsx` (buyer mode: no action buttons).
   - Handle unknown username with a 404 page.
3. Build `/store/[username]/[id]/page.tsx`:
   - Validate that listing belongs to the given username.
   - Render detail view (same price breakdown, minus vendor controls).
   - "Back to store" link.
4. Ensure pages are fully accessible without a session cookie.

**Deliverable:** Public storefront is live and shareable.

---

### Milestone 5 — Share Link

**Goal:** Vendors can easily copy and share their storefront URL.

**Tasks:**
1. Build `share-link-modal.tsx` with copy-to-clipboard logic.
2. Add "Share storefront" button to the vendor `/marketplace` page header.
3. Derive the storefront URL from `session.user.username` (no DB query needed).

**Deliverable:** Vendors can copy and share their public link from within the app.

---

### Milestone 6 — Polish & Consistency Pass

**Goal:** Ensure the feature feels native to the existing app.

**Tasks:**
1. Verify Suspense / skeleton loading on all new pages.
2. Verify empty states on all new pages.
3. Verify toast notifications for all create/update/delete operations.
4. Verify mobile responsiveness across all new pages and modals.
5. Confirm the public storefront does not expose any authenticated-only data, even when a logged-in user visits it.
6. Run through add-on propagation manually: edit a price, confirm listing totals update; delete a used add-on, confirm warning, confirm forced removal + recomputed total.
7. Confirm the `(store)` layout does not inherit the `(dashboard)` auth redirect.

**Deliverable:** Feature is production-ready and consistent with the rest of the app.
