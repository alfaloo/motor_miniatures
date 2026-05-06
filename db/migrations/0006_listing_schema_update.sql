ALTER TABLE "marketplace_listings" DROP COLUMN "base_price";--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "preorder_wait_days" integer;
