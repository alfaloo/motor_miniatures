CREATE TABLE "addon_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addon_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_addons" (
	"listing_id" uuid NOT NULL,
	"addon_option_id" uuid NOT NULL,
	CONSTRAINT "listing_addons_listing_id_addon_option_id_pk" PRIMARY KEY("listing_id","addon_option_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand" varchar(32) NOT NULL,
	"make" varchar(32) NOT NULL,
	"model" varchar(64) NOT NULL,
	"variant" varchar(128) NOT NULL,
	"scale" varchar(8) NOT NULL,
	"production_count" integer,
	"description" text,
	"is_preorder" boolean DEFAULT false NOT NULL,
	"base_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addon_categories" ADD CONSTRAINT "addon_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_options" ADD CONSTRAINT "addon_options_category_id_addon_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."addon_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_options" ADD CONSTRAINT "addon_options_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_addons" ADD CONSTRAINT "listing_addons_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_addons" ADD CONSTRAINT "listing_addons_addon_option_id_addon_options_id_fk" FOREIGN KEY ("addon_option_id") REFERENCES "public"."addon_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addon_categories_user_id_idx" ON "addon_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addon_options_category_id_idx" ON "addon_options" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "addon_options_user_id_idx" ON "addon_options" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "marketplace_listings_user_id_idx" ON "marketplace_listings" USING btree ("user_id");