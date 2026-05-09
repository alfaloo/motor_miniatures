ALTER TYPE "public"."listing_status" ADD VALUE 'unpublished';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storefront_show_active" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storefront_show_pre_order" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storefront_show_sold_out" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storefront_show_retired" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storefront_show_unpublished" boolean NOT NULL DEFAULT false;
