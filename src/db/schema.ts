import { integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { OrderLine } from "@/lib/order";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** Random code in the customer's confirmation link, so links can't be guessed. */
  code: text("code").notNull().unique(),
  /** Sent by the browser once per order attempt, so a retried submit can't create a second order. */
  clientKey: uuid("client_key").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  slot: text("slot").notNull(),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").$type<OrderLine[]>().notNull(),
  total: integer("total").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderRow = typeof orders.$inferSelect;
