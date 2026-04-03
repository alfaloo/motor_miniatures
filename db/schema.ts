import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 32 }).unique().notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  collecting_since_year: integer("collecting_since_year")
    .notNull()
    .default(sql`EXTRACT(YEAR FROM NOW())::INTEGER`),
  theme: varchar("theme", { length: 8 }).notNull().default("dark"),
  months_look_back: integer("months_look_back").notNull().default(12),
  top_values_count: integer("top_values_count").notNull().default(12),
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
