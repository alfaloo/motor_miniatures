ALTER TABLE "addon_categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "addon_options" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;