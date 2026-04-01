ALTER TABLE "users" ADD COLUMN "theme" varchar(8) DEFAULT 'dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "months_look_back" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "top_values_count" integer DEFAULT 12 NOT NULL;