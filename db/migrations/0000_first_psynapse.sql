CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"title" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand" varchar(32) NOT NULL,
	"make" varchar(32) NOT NULL,
	"model" varchar(64) NOT NULL,
	"variant" varchar(128) NOT NULL,
	"scale" varchar(8) NOT NULL,
	"serial_number" integer,
	"production_count" integer,
	"grade" integer,
	"purchase_price" integer NOT NULL,
	"purchase_platform" varchar(32) NOT NULL,
	"purchase_year" integer NOT NULL,
	"purchase_month" integer NOT NULL,
	"is_preorder" boolean DEFAULT false NOT NULL,
	"received_year" integer,
	"received_month" integer,
	"is_sold" boolean DEFAULT false NOT NULL,
	"sold_price" integer,
	"sold_platform" varchar(32),
	"sold_year" integer,
	"sold_month" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"password" varchar(256) NOT NULL,
	"collecting_since_year" integer DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_item_id_idx" ON "comments" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "items_user_id_idx" ON "items" USING btree ("user_id");