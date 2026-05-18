import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold_out",
  "retired",
  "pre_order",
  "unpublished",
]);
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 32 }).unique().notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  collecting_since_year: integer("collecting_since_year")
    .notNull()
    .default(sql`EXTRACT(YEAR FROM NOW())::INTEGER`),
  theme: varchar("theme", { length: 8 }).notNull().default("dark"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  months_look_back: integer("months_look_back").notNull().default(12),
  phone_number: varchar("phone_number", { length: 32 }),
  email_address: varchar("email_address", { length: 256 }),
  top_values_count: integer("top_values_count").notNull().default(12),
  storefront_show_active: boolean("storefront_show_active").notNull().default(true),
  storefront_show_pre_order: boolean("storefront_show_pre_order").notNull().default(true),
  storefront_show_sold_out: boolean("storefront_show_sold_out").notNull().default(false),
  storefront_show_retired: boolean("storefront_show_retired").notNull().default(false),
  storefront_show_unpublished: boolean("storefront_show_unpublished").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Identity
    brand: varchar("brand", { length: 32 }).notNull(),
    make: varchar("make", { length: 32 }).notNull(),
    model: varchar("model", { length: 64 }).notNull(),
    variant: varchar("variant", { length: 128 }).notNull(),
    scale: varchar("scale", { length: 8 }).notNull(), // '1/18' | '1/24' | '1/43' | '1/64'

    // Details
    serial_number: integer("serial_number"),
    production_count: integer("production_count"),
    grade: integer("grade"), // 1–10, nullable = ungraded

    // Purchase
    purchase_price: integer("purchase_price").notNull(),
    purchase_platform: varchar("purchase_platform", { length: 32 }).notNull(),
    purchase_year: integer("purchase_year").notNull(),
    purchase_month: integer("purchase_month").notNull(), // 1–12
    is_preorder: boolean("is_preorder").notNull().default(false),
    received_year: integer("received_year"),
    received_month: integer("received_month"),

    // Sale
    is_sold: boolean("is_sold").notNull().default(false),
    sold_price: integer("sold_price"),
    sold_platform: varchar("sold_platform", { length: 32 }),
    sold_year: integer("sold_year"),
    sold_month: integer("sold_month"),

    is_wishlist: boolean("is_wishlist").notNull().default(false),

    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("items_user_id_idx").on(table.user_id)]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    item_id: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 64 }).notNull(),
    description: text("description").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("comments_item_id_idx").on(table.item_id)]
);

export const addonCategories = pgTable(
  "addon_categories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("addon_categories_user_id_idx").on(table.user_id)]
);

export const addonOptions = pgTable(
  "addon_options",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    category_id: uuid("category_id")
      .notNull()
      .references(() => addonCategories.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    price: integer("price").notNull().default(0),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("addon_options_category_id_idx").on(table.category_id),
    index("addon_options_user_id_idx").on(table.user_id),
  ]
);

export const marketplaceListings = pgTable(
  "marketplace_listings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brand: varchar("brand", { length: 32 }).notNull(),
    make: varchar("make", { length: 32 }).notNull(),
    model: varchar("model", { length: 64 }).notNull(),
    variant: varchar("variant", { length: 128 }).notNull(),
    scale: varchar("scale", { length: 8 }).notNull(), // '1/18' | '1/24' | '1/43' | '1/64'
    production_count: integer("production_count"),
    description: text("description"),
    is_made_to_order: boolean("is_made_to_order").notNull().default(false),
    preorder_wait_days: integer("preorder_wait_days"),
    total_price: integer("total_price").notNull(),
    display_image_url: varchar("display_image_url", { length: 512 }),
    status: listingStatusEnum("status").notNull().default("active"),
    private_comments: text("private_comments"),
    sales_records: jsonb("sales_records").$type<SalesRecord[]>().notNull().default([]),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("marketplace_listings_user_id_idx").on(table.user_id)]
);

export const listingAddons = pgTable(
  "listing_addons",
  {
    listing_id: uuid("listing_id")
      .notNull()
      .references(() => marketplaceListings.id, { onDelete: "cascade" }),
    addon_option_id: uuid("addon_option_id")
      .notNull()
      .references(() => addonOptions.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.listing_id, table.addon_option_id] }),
  ]
);

export const userSocialLinks = pgTable(
  "user_social_links",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    url: varchar("url", { length: 512 }).notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("user_social_links_user_id_idx").on(table.user_id)]
);

// Type exports
export type SalesRecord = {
  id: string;        // crypto.randomUUID()
  sale_year: number;
  sale_month: number; // 1-12
  sale_price: number; // integer
};

export type ListingStatus = (typeof listingStatusEnum.enumValues)[number];
export type AddonCategory = typeof addonCategories.$inferSelect;
export type NewAddonCategory = typeof addonCategories.$inferInsert;
export type AddonOption = typeof addonOptions.$inferSelect;
export type NewAddonOption = typeof addonOptions.$inferInsert;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type MarketplaceListingInsert = typeof marketplaceListings.$inferInsert;
export type NewMarketplaceListing = typeof marketplaceListings.$inferInsert;
export type ListingAddon = typeof listingAddons.$inferSelect;
export type NewListingAddon = typeof listingAddons.$inferInsert;
export type UserSocialLink = typeof userSocialLinks.$inferSelect;
export type NewUserSocialLink = typeof userSocialLinks.$inferInsert;
