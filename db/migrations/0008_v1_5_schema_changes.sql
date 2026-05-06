ALTER TABLE "marketplace_listings"
  ADD COLUMN "display_image_url" VARCHAR(512);

ALTER TABLE "users"
  ADD COLUMN "phone_number" VARCHAR(32),
  ADD COLUMN "email_address" VARCHAR(256);

CREATE TABLE "user_social_links" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(64) NOT NULL,
  "url" VARCHAR(512) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "user_social_links_user_id_idx" ON "user_social_links"("user_id");
