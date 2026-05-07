CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold_out', 'retired', 'pre_order');
--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "status" "listing_status" NOT NULL DEFAULT 'active';
