"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { type FieldErrors, parseOrder } from "@/lib/order";
import { ordersOpen } from "@/lib/settings";

export type PlaceOrderState = { errors: FieldErrors };

export async function placeOrder(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  if (!ordersOpen()) return { errors: { form: "Preorders are closed." } };

  const result = parseOrder(Object.fromEntries(formData));
  if (!result.ok) return { errors: result.errors };
  const o = result.order;

  let code: string;
  try {
    const db = await getDb();
    const inserted = await db
      .insert(orders)
      .values({
        code: randomBytes(9).toString("base64url"),
        clientKey: o.clientKey,
        name: o.name,
        phone: o.phone,
        slot: o.slot,
        notes: o.notes,
        items: o.lines,
        total: o.total,
      })
      .onConflictDoNothing({ target: orders.clientKey })
      .returning({ code: orders.code });
    if (inserted[0]) {
      code = inserted[0].code;
    } else {
      // Same submit arrived twice: show the order the first one saved.
      const existing = await db.select({ code: orders.code }).from(orders).where(eq(orders.clientKey, o.clientKey));
      if (!existing[0]) throw new Error("order missing after conflict");
      code = existing[0].code;
    }
  } catch (err) {
    console.error("placeOrder failed", err);
    return { errors: { form: "We couldn't save your order. Please check your connection and try again." } };
  }
  redirect(`/order/${code}`);
}
