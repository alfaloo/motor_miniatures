ALTER TABLE "marketplace_listings" ADD COLUMN "private_comments" text;
--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "sales_records" jsonb NOT NULL DEFAULT '[]';
