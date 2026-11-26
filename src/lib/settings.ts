// Bazaar settings: pickup slots, payment details and when preorders close.

export const SHOP_NAME = "Porcafe";

export type Slot = { id: string; day: string; label: string };

function hourly(dateIso: string, dayLabel: string, fromHour: number, toHour: number): Slot[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const slots: Slot[] = [];
  for (let h = fromHour; h < toHour; h++) {
    slots.push({ id: `${dateIso}-${pad(h)}`, day: dayLabel, label: `${pad(h)}:00–${pad(h + 1)}:00` });
  }
  return slots;
}

/** Pickup windows: Thursday 3 Dec 09:00–15:00, Friday 4 Dec 09:00–18:00, in 1-hour slots. */
export const SLOTS: Slot[] = [
  ...hourly("2026-12-03", "Thu 3 Dec", 9, 15),
  ...hourly("2026-12-04", "Fri 4 Dec", 9, 18),
];

export const SLOT_DAYS = [...new Set(SLOTS.map((s) => s.day))];

const SLOT_BY_ID = new Map(SLOTS.map((s) => [s.id, s]));
export function findSlot(id: string): Slot | undefined {
  return SLOT_BY_ID.get(id);
}
export function slotLabel(id: string): string {
  const s = SLOT_BY_ID.get(id);
  return s ? `${s.day}, ${s.label}` : id;
}

/** Shown on the confirmation page. Empty fields are left out. */
export const PAYMENT = {
  bank: "",
  accountNumber: "",
  accountName: "",
  /** Path under /public, e.g. "/qris.png", or "" for none. */
  qrisImage: "/qris.jpg",
};

export function bankReady(): boolean {
  return Boolean(PAYMENT.bank && PAYMENT.accountNumber);
}

export function paymentReady(): boolean {
  return bankReady() || Boolean(PAYMENT.qrisImage);
}

/** ISO time when preorders close (Jakarta time), or null to keep them open. */
export const ORDERS_CLOSE_AT: string | null = null;

export function ordersOpen(now?: Date): boolean {
  if (ORDERS_CLOSE_AT === null) return true;
  return (now ?? new Date()) < new Date(ORDERS_CLOSE_AT);
}
