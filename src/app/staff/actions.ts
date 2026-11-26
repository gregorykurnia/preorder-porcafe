"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { checkPassword, isStaff, signIn, signOut } from "@/lib/staff-auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const attempt = String(formData.get("password") ?? "");
  if (!checkPassword(attempt)) return { error: "That password isn't right." };
  await signIn();
  redirect("/staff");
}

export async function logout(): Promise<void> {
  await signOut();
  redirect("/staff");
}

const toggleSchema = z.object({
  id: z.coerce.number().int().positive(),
  field: z.enum(["paid", "pickedUp"]),
  value: z.enum(["on", "off"]),
});

export type ToggleResult = { ok: true } | { ok: false; error: string };

/** Sets an order's paid or picked-up mark. Sets an exact value, so a repeated tap can't flip it back. */
export async function setMark(input: { id: number; field: "paid" | "pickedUp"; value: "on" | "off" }): Promise<ToggleResult> {
  if (!(await isStaff())) return { ok: false, error: "You're signed out. Reload the page and sign in again." };
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That change couldn't be read." };
  const { id, field, value } = parsed.data;
  const at = value === "on" ? new Date() : null;
  try {
    const db = await getDb();
    const updated = await db
      .update(orders)
      .set(field === "paid" ? { paidAt: at } : { pickedUpAt: at })
      .where(eq(orders.id, id))
      .returning({ id: orders.id });
    if (!updated[0]) return { ok: false, error: "That order no longer exists." };
  } catch (err) {
    console.error("setMark failed", err);
    return { ok: false, error: "Couldn't save. Check your connection and try again." };
  }
  refresh();
  return { ok: true };
}
