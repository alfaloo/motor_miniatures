# Vercel Blob Storage Setup

This guide walks through connecting the app to Vercel Blob, the storage service used by the v1.5 listing display image feature. You need this to upload and serve listing images in both local development and production.

---

## What Is Vercel Blob?

Vercel Blob is a first-party Vercel service for storing and serving files via a public CDN. The app uses it to store listing display images uploaded through the marketplace. Each image gets a stable public URL that is saved to the `display_image_url` column on `marketplace_listings`.

**Free-tier limits (Hobby plan):** 5 GB storage · 100 GB bandwidth per month. More than sufficient for a personal marketplace. Check [vercel.com/docs/storage/vercel-blob](https://vercel.com/docs/storage/vercel-blob) for current limits.

**The package is already installed** — `@vercel/blob` is listed in `package.json`. The setup below is purely configuration.

---

## How It's Wired Into the App

| File | Role |
|---|---|
| [`lib/blob.ts`](../lib/blob.ts) | `deleteListingImage(url)` utility — wraps `del()` from `@vercel/blob` |
| [`app/api/listings/upload-image/route.ts`](../app/api/listings/upload-image/route.ts) | `POST` handler — validates the file, calls `put()`, returns `{ url }` |
| [`lib/actions/marketplace.ts`](../lib/actions/marketplace.ts) | Calls `deleteListingImage` inside `updateListing` and `deleteListing` |
| [`components/listing-form.tsx`](../components/listing-form.tsx) | Posts to the upload route; stores the returned URL on the listing |

All of the code is already in place. The only thing missing is the `BLOB_READ_WRITE_TOKEN` environment variable.

---

## Part 1 — Create a Blob Store on Vercel

You need a Vercel project for this step. If you haven't deployed yet, follow [deployment.md](deployment.md) first, then come back here.

1. Open the [Vercel dashboard](https://vercel.com/dashboard) and select your project.
2. Click the **Storage** tab in the top navigation.
3. Click **"Create Database"** → choose **Blob** → click **"Continue"**.
4. Give the store a name (e.g. `motor-miniatures-blob`) — the name is cosmetic only.
5. Leave the region as the default nearest to you, then click **"Create"**.

Vercel creates the store and automatically links it to your project. The `BLOB_READ_WRITE_TOKEN` is added to your project's environment variables immediately — no manual copy-paste needed for production.

---

## Part 2 — Get the Token for Local Development

The token Vercel injected in Part 1 only applies to Vercel deployments. For local dev, you need to copy it into `.env.local` manually.

1. In the Vercel dashboard, go to **Storage** → click your Blob store.
2. Click the **".env.local"** tab (Vercel shows a ready-to-paste snippet).
3. Copy the value shown for `BLOB_READ_WRITE_TOKEN`.

Alternatively, get it from the project-level environment variables:

1. **Settings** → **Environment Variables**.
2. Find `BLOB_READ_WRITE_TOKEN` → click the copy icon.

Now open `.env.local` in the project root and add:

```env
# Vercel Blob — copy from Vercel dashboard → Storage → your Blob store → .env.local tab
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxx
```

> Restart the dev server after editing `.env.local` — Next.js does not hot-reload env files.

---

## Part 3 — Run the v1.5 Schema Migration

The listing image feature requires a new `display_image_url` column on `marketplace_listings`, as well as the `phone_number`, `email_address` columns on `users` and the `user_social_links` table added in the same migration.

If you haven't run migrations since pulling this branch:

```bash
npm run db:migrate
```

Expected output:
```
[✓] Migrations applied successfully
```

Migration file: [`db/migrations/0008_v1_5_schema_changes.sql`](../db/migrations/0008_v1_5_schema_changes.sql)

You can verify the column was added in the Neon SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'marketplace_listings' AND column_name = 'display_image_url';
```

---

## Part 4 — Verify Everything Works

Start the dev server:

```bash
npm run dev
```

Then test the upload path end-to-end:

1. Go to **Marketplace → New Listing**.
2. Fill in the required fields and select an image file (JPEG, PNG, or WebP, ≤ 5 MB).
3. Submit the form.
4. Open the listing detail page — the image should render.
5. In the Vercel dashboard → Storage → your Blob store → **Browse** — you should see a file under `listings/{listingId}/`.

---

## File Lifecycle

Understanding when blobs are created and deleted helps when debugging orphaned files:

| Event | What happens |
|---|---|
| Create listing (with image) | `createListing` is called first (no image), then the image is uploaded to get its URL, then `updateListingImage` persists the URL on the row |
| Edit listing (new image selected) | Old blob is deleted via `deleteListingImage`, new blob is uploaded, new URL is saved |
| Delete listing | `deleteListingImage` is called before the row is deleted; if deletion fails, the blob may be orphaned — clean it up manually in the dashboard |

Blob paths follow the pattern: `listings/{listingId}/{uuid}.{ext}`

---

## Environment Variable Reference

| Variable | Where to set | Required |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | `.env.local` (local dev) · Vercel dashboard (auto-set after linking) | Yes |

No other env changes are needed for blob storage.

---

## Troubleshooting

### `Error: BLOB_READ_WRITE_TOKEN is not set`

- Check that `BLOB_READ_WRITE_TOKEN` is present in `.env.local` with no extra spaces or quotes around the value.
- Restart the dev server — env changes require a restart.

### Upload returns 401 Unauthorized

- You must be logged in. The upload route at `/api/listings/upload-image` checks the session and rejects unauthenticated requests.

### Upload returns 400 with "Invalid file type"

- Only `image/jpeg`, `image/png`, and `image/webp` are accepted. Check the file's actual MIME type — some `.jpg` files from certain cameras may have an unexpected type.

### Upload returns 400 with "File too large"

- The limit is 5 MB (5 × 1024 × 1024 bytes). Compress or resize the image before uploading.

### Image uploaded successfully but doesn't display

- Confirm the `display_image_url` was saved to the database row. Open the listing in the edit form — if the image preview appears, the URL is persisted correctly.
- If the URL is saved but the `<img>` tag doesn't render, check the browser console for CORS or mixed-content errors. Vercel Blob URLs are served over HTTPS and should work in all environments.

### Orphaned blobs after a failed listing delete

- Open the Vercel dashboard → Storage → your Blob store → **Browse**.
- Navigate to `listings/{listingId}/` and delete the file manually.

### Token works locally but fails on Vercel deployment

- In the Vercel dashboard, go to **Settings → Environment Variables** and confirm `BLOB_READ_WRITE_TOKEN` is set for the correct environments (Production, Preview, Development).
- Vercel auto-sets this when you link the store to the project, but if you created the store after the initial link, redeploy once to pick up the new variable.
