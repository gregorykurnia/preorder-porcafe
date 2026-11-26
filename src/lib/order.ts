import { z } from "zod";
import { findProduct } from "./menu";
import { findSlot } from "./settings";

export type OrderLine = {
  productId: string;
  itemId: string;
  name: string;
  variant: string;
  qty: number;
  unitPrice: number;
};

export const MAX_QTY = 99;

/**
 * A random v4 UUID for one order attempt. Uses crypto.getRandomValues, not crypto.randomUUID:
 * browsers only offer randomUUID on HTTPS or localhost, and a phone opening the preview over
 * plain http (a LAN or Tailscale address) would crash on Place order.
 */
export function newOrderKey(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const cartSchema = z
  .array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(MAX_QTY) }))
  .max(50);

export const orderInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80, "That name is too long."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-().]/g, ""))
    .pipe(z.string().regex(/^\+?\d{8,15}$/, "Please enter a valid WhatsApp number.")),
  slot: z.string().refine((v) => Boolean(findSlot(v)), "Please choose a pickup time."),
  notes: z.string().trim().max(300, "Notes can be up to 300 characters.").optional().default(""),
  cart: z.string(),
  clientKey: z.string().uuid(),
});

export type FieldErrors = Partial<Record<"name" | "phone" | "slot" | "notes" | "cart" | "form", string>>;

export type ParsedOrder = {
  name: string;
  phone: string;
  slot: string;
  notes: string;
  clientKey: string;
  lines: OrderLine[];
  total: number;
};

/** Validates a submitted order and prices it from the menu (never from the client). */
export function parseOrder(input: Record<string, unknown>): { ok: true; order: ParsedOrder } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]) as keyof FieldErrors;
      if (key === ("clientKey" as string)) errors.form = "Something went wrong. Please reload the page and try again.";
      else if (!errors[key]) errors[key] = issue.message;
    }
  }

  let lines: OrderLine[] = [];
  const cartResult = (() => {
    try {
      return cartSchema.safeParse(JSON.parse(String(input.cart ?? "[]")));
    } catch {
      return null;
    }
  })();
  if (!cartResult || !cartResult.success) {
    errors.cart = "Your order couldn't be read. Please reload the page and try again.";
  } else {
    const merged = new Map<string, number>();
    for (const { productId, qty } of cartResult.data) {
      merged.set(productId, (merged.get(productId) ?? 0) + qty);
    }
    for (const [productId, qty] of merged) {
      const p = findProduct(productId);
      if (!p) {
        errors.cart = "One of the items is no longer on the menu. Please reload the page.";
        break;
      }
      if (qty > MAX_QTY) {
        errors.cart = `You can order up to ${MAX_QTY} of each item.`;
        break;
      }
      lines.push({ productId, itemId: p.itemId, name: p.name, variant: p.variant, qty, unitPrice: p.price });
    }
    if (!errors.cart && lines.length === 0) errors.cart = "Add at least one item to your order.";
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    lines = [];
    return { ok: false, errors };
  }
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  return { ok: true, order: { ...parsed.data, lines, total } };
}

export function orderNumber(id: number): string {
  return "PC-" + String(id).padStart(3, "0");
}

export function lineLabel(l: Pick<OrderLine, "name" | "variant">): string {
  return l.variant ? `${l.name} (${l.variant})` : l.name;
}
