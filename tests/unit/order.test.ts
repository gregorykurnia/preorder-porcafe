import { describe, expect, it } from "vitest";
import { orderNumber, parseOrder } from "@/lib/order";

const base = {
  name: "Ayu",
  phone: "0812-3456 7890",
  slot: "2026-12-03-09",
  notes: "",
  clientKey: "8b0f5c62-3c8f-4f7e-9d5f-0c6a0d1e2f3a",
};

describe("parseOrder", () => {
  it("prices the order from the menu, not from the client", () => {
    const r = parseOrder({
      ...base,
      cart: JSON.stringify([
        { productId: "pork-sate-10", qty: 2, price: 1 },
        { productId: "coffee-jelly-latte", qty: 1 },
      ]),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.total).toBe(2 * 110_000 + 25_000);
    expect(r.order.phone).toBe("081234567890");
    expect(r.order.lines[0]).toMatchObject({ itemId: "pork-sate", variant: "10 skewers", unitPrice: 110_000 });
  });

  it("merges repeated lines for the same product", () => {
    const r = parseOrder({ ...base, cart: JSON.stringify([{ productId: "samcan-telur", qty: 1 }, { productId: "samcan-telur", qty: 2 }]) });
    expect(r.ok && r.order.lines).toEqual([expect.objectContaining({ productId: "samcan-telur", qty: 3 })]);
  });

  it("rejects an empty cart, unknown items and bad quantities", () => {
    expect(parseOrder({ ...base, cart: "[]" })).toMatchObject({ ok: false, errors: { cart: expect.any(String) } });
    expect(parseOrder({ ...base, cart: JSON.stringify([{ productId: "nope", qty: 1 }]) })).toMatchObject({ ok: false });
    expect(parseOrder({ ...base, cart: JSON.stringify([{ productId: "samcan-telur", qty: 0 }]) })).toMatchObject({ ok: false });
    expect(parseOrder({ ...base, cart: JSON.stringify([{ productId: "samcan-telur", qty: 1.5 }]) })).toMatchObject({ ok: false });
    expect(parseOrder({ ...base, cart: "not json" })).toMatchObject({ ok: false });
  });

  it("names each missing field", () => {
    const r = parseOrder({ ...base, name: " ", phone: "12", slot: "2026-12-05-09", cart: JSON.stringify([{ productId: "samcan-telur", qty: 1 }]) });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["name", "phone", "slot"]);
  });

  it("formats order numbers", () => {
    expect(orderNumber(7)).toBe("PC-007");
    expect(orderNumber(1234)).toBe("PC-1234");
  });
});
