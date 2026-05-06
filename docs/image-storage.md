# Adding Image Storage with Vercel Blob

This guide covers how to add image storage to Motor Miniatures using **Vercel Blob** — an object store built into the Vercel platform. Images are stored in Vercel Blob and their public URLs are saved in your Neon database alongside each item.

---

## Why Vercel Blob?

Storing binary image data directly in PostgreSQL (as `bytea`) is an antipattern — it bloats the database, slows queries, complicates backups, and becomes expensive at scale. The right approach is to keep images in a dedicated object store and store only the URL in Neon.

Vercel Blob is the lowest-friction option for this stack:

- Natively integrated with Next.js — no extra accounts or infrastructure
- Upload directly from Server Actions or API routes
- Generous free tier (see limits below)
- Automatic CDN delivery — images are served from edge caches globally

---

## Free Tier Limits

| Resource | Free Tier Limit |
|---|---|
| Storage | 500 MB total |
| Bandwidth (egress) | 100 GB / month |
| File size (per upload) | 500 MB |
| Requests | Unlimited |

For a personal miniature collection with a few photos per item, the free tier will last a long time. Storage usage is visible in the Vercel dashboard under **Storage → Blob**.

---

## Part 1 — Enable Vercel Blob on Your Project

Vercel Blob is provisioned as a "Store" attached to your Vercel project. You must do this in the Vercel dashboard before writing any code.

### 1.1 Open Your Project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click on your `motor-miniatures` project.

### 1.2 Create a Blob Store

1. In the project sidebar, click **"Storage"**.
2. Click **"Create Database"**.
3. Select **"Blob"** from the list of storage options.
4. Click **"Continue"**.
5. Give the store a name — `motor-miniatures-images` works well.
6. Leave the region as the default (Vercel will pick the region closest to your deployment).
7. Click **"Create"**.

Vercel will provision the store and automatically add the required environment variable to your project:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxx
```

This token is automatically available in all environments (Production, Preview, Development) on Vercel.

### 1.3 Pull the Token to Your Local Environment

The token needs to be in your local `.env.local` so the app can upload images during local development.

**Option A — Vercel CLI (recommended):**

If you have the Vercel CLI installed (`npm i -g vercel`), pull all environment variables automatically:

```bash
vercel env pull .env.local
```

This overwrites `.env.local` with the latest values from Vercel, including the new `BLOB_READ_WRITE_TOKEN`. It will also include your existing `DATABASE_URL` and `AUTH_SECRET`.

> **Warning:** This overwrites the entire `.env.local` file. If you have local-only values (like `NEXTAUTH_URL=http://localhost:3000`), you will need to re-add them after pulling. Keep a copy before running this command.

**Option B — Copy manually:**

1. In the Vercel dashboard, go to your project → **Settings** → **Environment Variables**.
2. Find `BLOB_READ_WRITE_TOKEN` and click **"Copy"** next to the value.
3. Add it to your local `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxx
```

---

## Part 2 — Install the SDK

Install the official Vercel Blob client package:

```bash
npm install @vercel/blob
```

This package provides the `put`, `del`, `list`, and `head` functions used to interact with your Blob store.

---

## Part 3 — Add the Schema Column

Image URLs need to be persisted alongside each item in Neon. Add an `image_url` column to the `items` table.

### 3.1 Update the Schema

In [db/schema.ts](../db/schema.ts), add `image_url` to the `items` table definition:

```ts
image_url: varchar("image_url", { length: 512 }),
```

Place it in the `// Details` section, after `grade`. The field is nullable — existing items without photos are unaffected.

### 3.2 Generate the Migration

```bash
npm run db:generate
```

Drizzle will diff your schema against the last snapshot and write a new SQL migration file to `db/migrations/`. The generated SQL will look like:

```sql
ALTER TABLE "items" ADD COLUMN "image_url" varchar(512);
```

### 3.3 Apply the Migration

```bash
npm run db:migrate
```

This applies the new migration to your database. On next deployment, Vercel will apply it to production automatically (the `build` script runs migrations before building).

---

## Part 4 — Upload Images

Vercel Blob uploads can happen in a **Server Action** or a dedicated **API route**. A Server Action is the idiomatic Next.js 15 approach and keeps the upload logic co-located with the rest of your form actions.

### 4.1 How Upload Works

The flow for adding an image to an item:

1. User selects a file in the form (`<input type="file">`)
2. The form is submitted — the file is sent as `multipart/form-data`
3. The Server Action receives the file as a `File` object from `FormData`
4. The action calls `put()` from `@vercel/blob` to upload the file
5. `put()` returns a `{ url }` object — this is the permanent public CDN URL
6. The URL is saved to the `items.image_url` column in Neon

### 4.2 Basic Upload Pattern

```ts
import { put } from "@vercel/blob";

// Inside a Server Action that handles FormData:
const file = formData.get("image") as File | null;

let imageUrl: string | null = null;
if (file && file.size > 0) {
  const blob = await put(file.name, file, {
    access: "public",         // makes the URL publicly accessible (no auth needed to view)
    addRandomSuffix: true,    // prevents filename collisions between users
  });
  imageUrl = blob.url;
}
```

The `access: "public"` flag is required for images to be displayable in `<img>` tags without authentication. All URLs from a public blob are served over HTTPS via Vercel's CDN.

### 4.3 Replacing an Image

When a user uploads a new image for an existing item, delete the old blob first to avoid accumulating orphaned files:

```ts
import { put, del } from "@vercel/blob";

// existingItem.image_url is the URL stored in the database
if (existingItem.image_url) {
  await del(existingItem.image_url);
}

const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
imageUrl = blob.url;
```

### 4.4 Deleting an Image

When an item is deleted, clean up its blob too:

```ts
import { del } from "@vercel/blob";

if (item.image_url) {
  await del(item.image_url);
}
```

---

## Part 5 — Display Images

Once the URL is in the database, display images using Next.js's `<Image>` component. This handles lazy loading, resizing, and format conversion automatically.

### 5.1 Allow the Blob Hostname in next.config

Next.js blocks external image domains by default. Add the Vercel Blob CDN hostname to `next.config.ts` (or `next.config.js`):

```ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
```

The wildcard `*.public.blob.vercel-storage.com` covers all Vercel Blob stores regardless of region.

### 5.2 Render the Image

```tsx
import Image from "next/image";

{item.image_url && (
  <Image
    src={item.image_url}
    alt={`${item.brand} ${item.model}`}
    width={400}
    height={300}
    className="rounded-md object-cover"
  />
)}
```

Use `object-cover` (Tailwind) to prevent distortion when images have varying aspect ratios.

---

## Part 6 — File Validation

Always validate uploads on the server before calling `put()`. Do not rely on browser-side validation alone.

### Recommended validation

```ts
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

if (file && file.size > 0) {
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5 MB or smaller." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and AVIF images are allowed." };
  }
  // proceed with put()
}
```

Restricting MIME types prevents users from accidentally (or intentionally) uploading non-image files.

---

## Part 7 — Deployment Checklist

Before deploying:

- [ ] `npm run db:generate` was run and the new migration file is committed
- [ ] `npm run db:migrate` was run locally and the `image_url` column exists in your dev database
- [ ] `@vercel/blob` is in `package.json` dependencies
- [ ] `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables (auto-set when you created the store)
- [ ] `next.config.ts` has the `*.public.blob.vercel-storage.com` remote pattern
- [ ] Old blobs are deleted before uploading replacements (prevent storage waste)
- [ ] Old blobs are deleted when items are deleted (prevent orphaned files)

Push to `main` and Vercel will:
1. Run `npm run db:migrate` — applies the `image_url` column migration to production Neon
2. Run `next build` — picks up the new `remotePatterns` config and `@vercel/blob` dependency

---

## Environment Variable Reference

| Variable | Required | Where | Description |
|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel (auto) + `.env.local` | Auth token for the Vercel Blob store — auto-created when you provision the store |

The token is auto-injected into all Vercel environments when you create the Blob store. You only need to add it manually to `.env.local`.

---

## Troubleshooting

### Upload fails: `BlobAccessError: Access denied`

- `BLOB_READ_WRITE_TOKEN` is missing or incorrect in `.env.local`.
- Run `vercel env pull .env.local` to re-sync, then restart the dev server.
- Ensure the token starts with `vercel_blob_rw_` — read-only tokens (`vercel_blob_ro_`) cannot upload.

### Image doesn't display: `Error: Invalid src prop`

- The `*.public.blob.vercel-storage.com` pattern is missing from `next.config.ts`.
- After editing `next.config.ts`, restart the dev server — config changes are not hot-reloaded.

### Image displays as broken link after item edit

- The old blob URL was deleted but the new URL wasn't saved to the database (or vice versa).
- Ensure the `del()` and `put()` calls happen before the database update, so a failure at either step doesn't leave the database in an inconsistent state.

### Blobs accumulating but items have no images

- Uploads are succeeding but the URL isn't being written to the database (the item save action may be failing after the upload).
- Use the Vercel dashboard → **Storage → Blob** → **Browse** to see all stored files and manually delete orphans if needed.
- Add the `del()` call to your item delete action to prevent this going forward.

### `next build` fails: `TypeError: Invalid URL` in image optimization

- The Blob URL pattern in `remotePatterns` has a typo. Verify it is exactly `*.public.blob.vercel-storage.com` with no trailing slash.
