import { describe, expect, it } from "vitest";
import { type StaffOrder, applyFilters, itemTotals, readFilters } from "@/lib/filters";

const line = (productId: string, itemId: string, variant: string, qty: number) => ({
  productId,
  itemId,
  name: itemId,
  variant,
  qty,
  unitPrice: 1,
});

const orders: StaffOrder[] = [
  { id: 1, name: "Ayu Lestari", phone: "+6281234567890", slot: "2026-12-03-09", notes: "", total: 1, paid: true, pickedUp: false,
    items: [line("pork-sate-5", "pork-sate", "5 skewers", 2), line("coffee-jelly-latte", "coffee-jelly-latte", "", 1)] },
  { id: 2, name: "Budi", phone: "081299990000", slot: "2026-12-04-10", notes: "", total: 1, paid: false, pickedUp: false,
    items: [line("pork-sate-10", "pork-sate", "10 skewers", 1)] },
  { id: 3, name: "Citra", phone: "0811111111", slot: "2026-12-04-11", notes: "", total: 1, paid: true, pickedUp: true,
    items: [line("samcan-telur", "samcan-telur", "", 3)] },
];

const f = (sp: Record<string, string>) => readFilters(sp);
const ids = (list: StaffOrder[]) => list.map((o) => o.id);

describe("staff filters", () => {
  it("filters by menu item across sizes", () => {
    expect(ids(applyFilters(orders, f({ item: "pork-sate" })))).toEqual([1, 2]);
  });

  it("finds a customer by name, order number or phone in either 08 or +62 form", () => {
    expect(ids(applyFilters(orders, f({ q: "ayu" })))).toEqual([1]);
    expect(ids(applyFilters(orders, f({ q: "PC-002" })))).toEqual([2]);
    expect(ids(applyFilters(orders, f({ q: "0812 3456" })))).toEqual([1]);
    expect(ids(applyFilters(orders, f({ q: "+62812999" })))).toEqual([2]);
  });

  it("filters by paid and picked up, combined with other filters", () => {
    expect(ids(applyFilters(orders, f({ paid: "no" })))).toEqual([2]);
    expect(ids(applyFilters(orders, f({ picked: "yes" })))).toEqual([3]);
    expect(ids(applyFilters(orders, f({ paid: "yes", picked: "no" })))).toEqual([1]);
    expect(ids(applyFilters(orders, f({ item: "pork-sate", paid: "yes" })))).toEqual([1]);
  });

  it("ignores unknown filter values", () => {
    expect(f({ item: "bogus", paid: "maybe" })).toEqual({ q: "", item: "", paid: "all", picked: "all" });
  });

  it("totals an item by size, in menu order", () => {
    const reversed = [...orders].reverse();
    expect(itemTotals(reversed, "pork-sate").map((t) => t.variant)).toEqual(["5 skewers", "10 skewers"]);
    expect(itemTotals(orders, "pork-sate")).toEqual([
      { variant: "5 skewers", qty: 2 },
      { variant: "10 skewers", qty: 1 },
    ]);
  });
});
