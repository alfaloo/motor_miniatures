/**
 * Vercel Deployment Steps:
 * 1. Create a Neon DB project at neon.tech and copy the connection string.
 * 2. In Vercel project settings > Environment Variables, add:
 *    - DATABASE_URL  (Neon connection string with ?sslmode=require)
 *    - AUTH_SECRET   (run: openssl rand -hex 32)
 *    - NEXTAUTH_URL is NOT needed on Vercel — omit it in production.
 * 3. Push to the main branch; Vercel auto-builds with:
 *    npm run db:migrate && next build
 *    which applies any pending Drizzle migrations before the build.
 * 4. For local dev, copy .env.local and fill in real values.
 */
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
