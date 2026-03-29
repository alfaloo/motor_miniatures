# Running Motor Miniatures Locally

This guide covers everything you need to run the app on your machine for local testing and development.

---

## Do I Need a Database?

**Yes.** The app uses [`@neondatabase/serverless`](https://github.com/neondatabase/serverless) with `drizzle-orm/neon-http`, which connects to Neon via their proprietary HTTP API — not a standard PostgreSQL TCP connection. This means **a plain local PostgreSQL instance will not work**. You need a live Neon database even for local development.

The good news: Neon's free tier (1 project, 0.5 GB) is more than enough. You can either:

- **Option A (quickest):** Reuse your production Neon database for local dev too — fine for personal projects where you don't mind mixing test data with real data.
- **Option B (recommended):** Create a free Neon **branch** off your production database. Branches are instant, free, and isolated — you can delete or reset them without touching production.

Both options are covered below.

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 20.x | `node -v` |
| npm | 10.x | `npm -v` |
| Git | any | `git --version` |

Install Node 20 via [nodejs.org](https://nodejs.org) or `nvm`:
```bash
nvm install 20
nvm use 20
```

---

## Part 1 — Get a Local Database Connection String

### Option A — Reuse the Production Database

If you already deployed to Vercel (see [deployment.md](deployment.md)), you already have a Neon project. Just copy the same connection string you used there.

1. Go to [console.neon.tech](https://console.neon.tech) and open your project.
2. On the **Dashboard** tab, click **"Connection string"**.
3. Ensure the branch is set to **`main`** and copy the string.

It will look like:
```
postgresql://neondb_owner:xxxxxxxxxxxx@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Skip to Part 2.

---

### Option B — Create a Dev Branch (Recommended)

A Neon branch is a full copy-on-write snapshot of the database at that point in time. It shares storage with the parent branch for unchanged data, making it effectively free for small projects.

1. In the Neon dashboard, open your project.
2. Click **"Branches"** in the left sidebar → **"New Branch"**.
3. Fill in:
   - **Branch name**: `dev`
   - **Branch from**: `main` (head)
   - **Add new compute**: leave checked (creates a compute endpoint for this branch)
4. Click **"Create branch"**.
5. Once created, click on the `dev` branch → **"Connection string"** and copy it.

The `dev` branch connection string will look similar to the main one but with a different endpoint ID (`ep-...`).

**Benefits of this approach:**
- Local test data never pollutes production
- You can run destructive tests freely
- Schema experiments stay isolated
- Reset the branch at any time: Neon dashboard → branch → **"Reset to parent"**

---

## Part 2 — Configure .env.local

Open [.env.local](.env.local) in the project root. Replace the placeholder values with real ones:

```env
# Neon DB — paste your connection string here (Option A or B from Part 1)
DATABASE_URL=postgresql://neondb_owner:xxxxxxxxxxxx@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require

# NextAuth — any random secret works locally; generate one with:
# openssl rand -hex 32
AUTH_SECRET=your_64_char_hex_secret_here

# NextAuth URL — required locally so NextAuth knows the base URL for redirects
NEXTAUTH_URL=http://localhost:3000
```

> **`NEXTAUTH_URL=http://localhost:3000` is required for local dev** — without it, login redirects will break. Do not add this variable to Vercel (it's only needed locally).

Keep `.env.local` out of version control — it's already in [.gitignore](.gitignore).

---

## Part 3 — Install Dependencies

```bash
npm install
```

This installs everything listed in `package.json` including Next.js, Drizzle, NextAuth, shadcn/ui components, and Recharts.

---

## Part 4 — Run Database Migrations

Before starting the dev server for the first time, create the database tables by running the Drizzle migrations:

```bash
npm run db:migrate
```

This executes `drizzle-kit migrate`, which reads the SQL files in [db/migrations/](db/migrations/) and applies any that haven't been run yet against your Neon database.

Expected output:
```
[✓] Migrations applied successfully
```

You can verify the tables were created in the Neon dashboard under **"Tables"** — you should see `users`, `items`, and `comments`.

> You only need to run this once per new branch. After that, only run it again when you pull changes that include new migration files.

---

## Part 5 — Start the Development Server

```bash
npm run dev
```

Next.js will start in development mode:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.1s
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Part 6 — First Run Walkthrough

On first load you'll be redirected to `/login`. The database is empty, so you need to register an account first.

### Register an account

1. Click **"Register"** (or go to [http://localhost:3000/register](http://localhost:3000/register))
2. Enter a username (3–32 chars, alphanumeric + underscores) and a password (min 8 chars)
3. Click **"Create account"** — you'll be redirected to `/login`

### Log in

1. Enter your credentials and click **"Sign in"**
2. You'll land on the collection index (`/`) showing an empty state

### Test the main flows

| Flow | Where to go |
|---|---|
| Add a model car | Click **"Add Item"** on the home page |
| View/edit an item | Hover a card → **View** or **Edit** |
| Delete an item | Hover a card → **Delete** (confirms with a modal) |
| Search your collection | **Search** in the navbar |
| View analytics | **Dashboard** in the navbar |
| Update collecting year | **Settings** in the navbar |
| Add a comment to an item | Open any item → **"Add Comment"** |
| Log out | Click your username (top right) → **"Log Out"** |

---

## Part 7 — Development Workflow

### Hot reload

Next.js dev mode includes full hot reload. Editing any file in `app/`, `components/`, or `lib/` will automatically refresh the browser. You don't need to restart the server.

### Making schema changes

If you modify [db/schema.ts](db/schema.ts), you need to generate and apply a new migration:

```bash
# Step 1 — generate a new SQL migration file from your schema changes
npm run db:generate

# Step 2 — apply the migration to your database
npm run db:migrate
```

New migration files are created in [db/migrations/](db/migrations/). Commit these alongside your schema changes.

### Resetting the local database

If you want a clean slate (e.g. corrupted test data, schema conflicts):

**Using a Neon branch (Option B):** Reset the branch in the Neon dashboard → Branches → `dev` → **"Reset to parent"**. This wipes all data and resets the schema to match `main`.

**Nuke and re-create approach:** In the Neon SQL Editor, run:
```sql
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;
```
Then re-run `npm run db:migrate` to recreate the tables from scratch.

---

## Quick Reference

```bash
# Install dependencies
npm install

# Run migrations (first time, or after schema changes)
npm run db:migrate

# Start dev server
npm run dev

# Generate a new migration after changing db/schema.ts
npm run db:generate && npm run db:migrate

# Build and test the production bundle locally
npm run build && npm run start
```

---

## Troubleshooting

### `Error: DATABASE_URL is not defined`

- Check that `.env.local` exists in the project root (not a subdirectory).
- Make sure the variable name is exactly `DATABASE_URL` (no typos, no quotes around the value).
- Restart the dev server after editing `.env.local` — Next.js does not hot-reload env files.

### `SSL connection error` during migration

- Your `DATABASE_URL` must end with `?sslmode=require`. Neon requires SSL on all connections.

### Login redirects to a broken URL

- Make sure `NEXTAUTH_URL=http://localhost:3000` is set in `.env.local`.
- After editing `.env.local`, stop the dev server (`Ctrl+C`) and restart with `npm run dev`.

### `Error: AUTH_SECRET is not set`

- Add `AUTH_SECRET` to `.env.local`. Any string works locally; generate one with `openssl rand -hex 32`.

### Migration runs but tables aren't created

- Open the Neon SQL Editor (dashboard → **SQL Editor**) and run `SELECT * FROM users LIMIT 1;` to confirm the table exists.
- Check that your `DATABASE_URL` is pointing to the correct Neon project and branch.
- Re-run `npm run db:migrate` and look for error output.

### Port 3000 already in use

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or start Next.js on a different port
npm run dev -- -p 3001
```
If using a different port, update `NEXTAUTH_URL` in `.env.local` to match (e.g. `http://localhost:3001`).
