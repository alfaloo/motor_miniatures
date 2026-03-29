# Deploying Motor Miniatures to Vercel with Neon DB

This guide walks through the complete process of deploying Motor Miniatures to production using **Vercel** (hosting) and **Neon** (serverless PostgreSQL database), both of which have generous free tiers.

---

## Prerequisites

- A [GitHub](https://github.com) account (to push the repo and connect to Vercel)
- A [Vercel](https://vercel.com) account (free — sign up with GitHub)
- A [Neon](https://neon.tech) account (free — sign up with GitHub or email)
- Node.js 20+ installed locally
- The Motor Miniatures repo pushed to a GitHub repository

---

## Part 1 — Set Up Neon DB (Free Tier)

Neon provides a free-tier serverless PostgreSQL database. The free tier includes 0.5 GB storage, 1 compute unit, and enough bandwidth for personal projects.

### 1.1 Create a Neon Project

1. Go to [neon.tech](https://neon.tech) and sign in (or create a free account).
2. Click **"New Project"** on the dashboard.
3. Fill in the form:
   - **Project name**: `motor-miniatures` (or any name you prefer)
   - **PostgreSQL version**: `16` (latest stable — Neon's default)
   - **Region**: choose the region closest to your Vercel deployment (e.g. `US East (N. Virginia)` for `iad1`, or `EU (Frankfurt)` for `fra1`)
4. Click **"Create project"**.

Neon will provision the database and immediately show you the **connection string**. It looks like:

```
postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 1.2 Copy the Connection String

1. In the Neon dashboard, go to your project's **Dashboard** tab.
2. Under **Connection Details**, select the **"Connection string"** tab.
3. Make sure **"Pooled connection"** is **OFF** for now (the `db:migrate` script uses a direct connection).
4. Copy the full connection string — you will need it in the next steps.

> **Note:** Neon connection strings always include `?sslmode=require`. Do **not** remove this — it is required for Neon's TLS connections.

### 1.3 Understand the Neon Free Tier Limits

| Resource | Free Tier Limit |
|---|---|
| Storage | 0.5 GB |
| Compute | 1 shared CU (auto-suspends after 5 min idle) |
| Branches | 10 |
| Projects | 1 |
| Bandwidth | 5 GB / month |

Auto-suspend means the database compute "wakes up" on the first connection after idle, which can add ~1–2 seconds to a cold request. This is normal for the free tier.

---

## Part 2 — Generate the AUTH_SECRET

NextAuth requires a secret key for signing JWTs. Generate one now:

```bash
openssl rand -hex 32
```

Copy the output — it will be a 64-character hex string like:

```
a3f8c2d1e94b7f0612345678abcdef9012345678abcdef9012345678abcdef90
```

Keep this value safe. You will add it as a Vercel environment variable.

---

## Part 3 — Push the Repo to GitHub

If you haven't already pushed the project to GitHub:

```bash
# In the project root
git remote add origin https://github.com/YOUR_USERNAME/motor-miniatures.git
git push -u origin main
```

Vercel connects directly to your GitHub repo, so the code must be on GitHub before you can deploy.

---

## Part 4 — Deploy to Vercel

### 4.1 Import the Project

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **"Add New…"** → **"Project"**.
3. Under **"Import Git Repository"**, find your `motor-miniatures` repository and click **"Import"**.

### 4.2 Configure the Project

Vercel will auto-detect Next.js and pre-fill most settings. Verify:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `.` (project root — leave as default) |
| **Build Command** | `npm run build` (auto-detected from `package.json`) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |
| **Node.js Version** | `20.x` (set in Project Settings → General → Node.js Version) |

> The `build` script in `package.json` is already configured to run migrations before building:
> ```json
> "build": "npm run db:migrate && next build"
> ```
> This means every Vercel deployment automatically applies any pending database migrations before the new app version goes live.

### 4.3 Add Environment Variables

This is the most critical step. Before clicking **"Deploy"**, scroll down to the **"Environment Variables"** section and add the following:

#### Variable 1 — DATABASE_URL

| Field | Value |
|---|---|
| **Name** | `DATABASE_URL` |
| **Value** | The Neon connection string from Part 1.2 |
| **Environments** | Production, Preview, Development (check all three) |

Example value:
```
postgresql://neondb_owner:xxxxxxxxxxxx@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Variable 2 — AUTH_SECRET

| Field | Value |
|---|---|
| **Name** | `AUTH_SECRET` |
| **Value** | The 64-character hex string from Part 2 |
| **Environments** | Production, Preview, Development (check all three) |

> **Do NOT add `NEXTAUTH_URL`** — on Vercel, NextAuth v5 automatically detects the deployment URL from the `VERCEL_URL` environment variable. Adding `NEXTAUTH_URL` manually can break OAuth redirects in preview deployments.

After adding both variables, click **"Deploy"**.

### 4.4 Watch the Build Logs

Vercel will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run `npm run build`, which:
   - Runs `drizzle-kit migrate` — this connects to Neon and creates the `users`, `items`, and `comments` tables from your migration files in `db/migrations/`
   - Runs `next build` to compile the app

If everything succeeds, you'll see a green **"Congratulations!"** screen with your deployment URL (e.g. `https://motor-miniatures.vercel.app`).

---

## Part 5 — Verify the Deployment

### 5.1 Check the Database

1. Go to your Neon project dashboard.
2. Open the **"Tables"** tab (or use the **SQL Editor**).
3. Verify that the following tables were created:
   - `users`
   - `items`
   - `comments`

If the tables are missing, check the Vercel build logs for migration errors. The most common cause is an incorrect `DATABASE_URL`.

### 5.2 Test the Application

1. Visit your deployment URL.
2. You should be redirected to `/login`.
3. Click **"Register"** and create an account.
4. Log in and verify that:
   - The collection index (`/`) loads with an empty state
   - You can add an item via **"Add Item"**
   - The Dashboard (`/dashboard`) shows stats (all zeroes initially)
   - Settings (`/settings`) shows your `collecting_since_year`

---

## Part 6 — Local Development Setup

After deploying to Vercel, configure your local environment to use the same Neon database (or a separate Neon branch for local dev — see Part 7).

### 6.1 Update .env.local

Replace the placeholder values in `.env.local`:

```env
# Neon DB — your actual Neon connection string
DATABASE_URL=postgresql://neondb_owner:xxxxxxxxxxxx@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require

# NextAuth — your generated 32-byte hex secret
AUTH_SECRET=a3f8c2d1e94b7f0612345678abcdef9012345678abcdef9012345678abcdef90

# NextAuth URL — only needed for local development
NEXTAUTH_URL=http://localhost:3000
```

> `NEXTAUTH_URL` **is** needed locally (so NextAuth knows the base URL for redirects), but should **not** be added to Vercel environment variables.

### 6.2 Run the Development Server

```bash
npm install       # if not already done
npm run dev       # starts on http://localhost:3000
```

---

## Part 7 — (Optional) Use a Neon Branch for Local Development

Neon supports **database branching** — you can create a separate branch of your production database for local development, keeping your production data safe.

1. In the Neon dashboard, click **"Branches"** → **"New Branch"**.
2. Name it `dev` and create it from the `main` branch.
3. Copy the connection string for the `dev` branch.
4. Use the `dev` branch connection string in your local `.env.local`.
5. Use the `main` branch connection string in Vercel's environment variables.

This way:
- Local dev writes go to the `dev` branch
- Vercel production reads/writes go to the `main` branch
- You can reset the `dev` branch at any time without affecting production

---

## Part 8 — Automatic Deployments (CI/CD)

Once connected, every push to the `main` branch triggers a new Vercel deployment automatically:

1. Push code to `main`:
   ```bash
   git push origin main
   ```
2. Vercel detects the push and starts a build.
3. The build runs `npm run db:migrate && next build` — migrations are applied before the new code goes live.
4. If the build passes, the new version is deployed to your production URL.

### Preview Deployments

Every push to a non-`main` branch (e.g. a feature branch) automatically gets a **preview deployment** at a unique URL like:
```
https://motor-miniatures-git-feature-branch-yourname.vercel.app
```

Preview deployments use the same environment variables as production (including `DATABASE_URL`), so they connect to your Neon database. If you're making schema changes, use a separate Neon branch for previews (see Part 7).

---

## Part 9 — Custom Domain (Optional)

To use a custom domain instead of `*.vercel.app`:

1. In the Vercel project dashboard, go to **Settings** → **Domains**.
2. Click **"Add"** and enter your domain (e.g. `motorminiatures.com`).
3. Follow the instructions to add a DNS record at your domain registrar:
   - For an apex domain: add an **A record** pointing to `76.76.21.21`
   - For a subdomain: add a **CNAME record** pointing to `cname.vercel-dns.com`
4. Vercel automatically provisions an SSL certificate via Let's Encrypt.

---

## Environment Variable Reference

| Variable | Required | Where | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | Vercel + `.env.local` | Neon PostgreSQL connection string with `?sslmode=require` |
| `AUTH_SECRET` | Yes | Vercel + `.env.local` | 64-char hex secret for signing JWTs — generate with `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Local only | `.env.local` only | Base URL for NextAuth redirects — set to `http://localhost:3000` locally, **omit on Vercel** |

---

## Troubleshooting

### Build fails: `Error: DATABASE_URL is not set`

- Verify the `DATABASE_URL` environment variable is added in Vercel → Project Settings → Environment Variables.
- Ensure it is enabled for the **Production** environment.
- Redeploy after adding variables (Vercel does not auto-redeploy on env var changes).

### Build fails during migration: `SSL connection required`

- Your connection string must include `?sslmode=require` at the end.
- Neon requires SSL — do not remove this parameter.

### Login fails after deployment: `NEXTAUTH_SECRET is not set`

- Ensure `AUTH_SECRET` (not `NEXTAUTH_SECRET`) is set in Vercel environment variables.
- NextAuth v5 (Auth.js) uses `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

### Database tables missing after first deploy

- Check the Vercel build logs for the `drizzle-kit migrate` step.
- Ensure `DATABASE_URL` has write permissions (Neon free tier allows full DDL on the main branch).
- You can manually run migrations locally with `npm run db:migrate` to verify the connection string is correct.

### Neon database is slow on first request

- This is expected on the free tier — Neon auto-suspends compute after 5 minutes of inactivity.
- The first request after a suspend period takes ~1–2 seconds to wake the compute.
- Subsequent requests are fast. This behaviour cannot be changed on the free tier.

### `NEXTAUTH_URL` mismatch errors in preview deployments

- Do not set `NEXTAUTH_URL` in Vercel environment variables.
- NextAuth v5 on Vercel automatically uses `VERCEL_URL` for preview deployments and your custom domain for production.
