import { ITEMS, PRODUCTS } from "./menu";
import type { OrderLine } from "./order";
import { orderNumber } from "./order";

export type StaffOrder = {
  id: number;
  name: string;
  phone: string;
  slot: string;
  notes: string;
  items: OrderLine[];
  total: number;
  paid: boolean;
  pickedUp: boolean;
};

export type Filters = {
  q: string;
  item: string;
  paid: "all" | "yes" | "no";
  picked: "all" | "yes" | "no";
};

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const item = one("item") ?? "";
  return {
    q: (one("q") ?? "").trim().slice(0, 80),
    item: ITEMS.some((i) => i.id === item) ? item : "",
    paid: pick(one("paid"), ["all", "yes", "no"] as const, "all"),
    picked: pick(one("picked"), ["all", "yes", "no"] as const, "all"),
  };
}

function digits(s: string) {
  return s.replace(/\D/g, "");
}

export function matchesSearch(o: StaffOrder, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (o.name.toLowerCase().includes(needle)) return true;
  if (orderNumber(o.id).toLowerCase().includes(needle)) return true;
  const d = digits(q);
  if (d.length >= 3) {
    const phone = digits(o.phone);
    // Match 0812… against +62812… and the other way round.
    const strip = (p: string) => p.replace(/^62/, "").replace(/^0/, "");
    if (phone.includes(d) || strip(phone).includes(strip(d))) return true;
  }
  return false;
}

export function applyFilters(orders: StaffOrder[], f: Filters): StaffOrder[] {
  return orders.filter(
    (o) =>
      matchesSearch(o, f.q) &&
      (!f.item || o.items.some((l) => l.itemId === f.item)) &&
      (f.paid === "all" || o.paid === (f.paid === "yes")) &&
      (f.picked === "all" || o.pickedUp === (f.picked === "yes")),
  );
}

/** Quantity of one menu item across the given orders, split by size. */
export function itemTotals(orders: StaffOrder[], itemId: string): { variant: string; qty: number }[] {
  const byVariant = new Map<string, number>();
  for (const o of orders) {
    for (const l of o.items) {
      if (l.itemId === itemId) byVariant.set(l.variant, (byVariant.get(l.variant) ?? 0) + l.qty);
    }
  }
  const menuOrder = PRODUCTS.filter((p) => p.itemId === itemId).map((p) => p.variant);
  return [...byVariant]
    .map(([variant, qty]) => ({ variant, qty }))
    .sort((a, b) => menuOrder.indexOf(a.variant) - menuOrder.indexOf(b.variant));
}
