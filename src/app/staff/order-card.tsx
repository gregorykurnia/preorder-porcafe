"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import type { StaffOrder } from "@/lib/filters";
import { formatRp } from "@/lib/menu";
import { lineLabel, orderNumber } from "@/lib/order";
import { slotLabel } from "@/lib/settings";
import { setMark } from "./actions";

export function OrderCard({ order, highlightItem }: { order: StaffOrder; highlightItem: string }) {
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const [marks, setOptimistic] = useOptimistic(
    { paid: order.paid, pickedUp: order.pickedUp },
    (cur, change: { field: "paid" | "pickedUp"; on: boolean }) => ({ ...cur, [change.field]: change.on }),
  );

  function toggle(field: "paid" | "pickedUp") {
    const on = !marks[field];
    setError("");
    startTransition(async () => {
      setOptimistic({ field, on });
      const res = await setMark({ id: order.id, field, value: on ? "on" : "off" });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="solid flex flex-col p-5" data-testid="order-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-[14px] text-muted">
            {orderNumber(order.id)} · {slotLabel(order.slot)}
          </p>
          <p className="mt-0.5 break-words text-[18px] font-bold">{order.name}</p>
          <a href={`tel:${order.phone}`} className="num text-[15px] text-accent">
            {order.phone}
          </a>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {marks.paid ? (
            <span className="tag bg-[var(--good-tint)] text-good">Paid</span>
          ) : (
            <span className="tag bg-[var(--warn-tint)] text-[var(--warn)]">Unpaid</span>
          )}
          {marks.pickedUp && <span className="tag bg-[var(--accent-tint)] text-[var(--accent-strong)]">Picked up</span>}
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-[15px]">
        {order.items.map((l) => (
          <li
            key={l.productId}
            className={
              highlightItem && l.itemId === highlightItem ? "-mx-2 rounded-lg bg-[var(--accent-tint)] px-2 font-semibold" : undefined
            }
          >
            <span className="num font-semibold">{l.qty}×</span> {lineLabel(l)}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-2 break-words text-[15px] text-muted">Notes: {order.notes}</p>}
      <p className="num mt-3 text-[16px] font-bold">{formatRp(order.total)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MarkButton label="Paid" on={marks.paid} onClick={() => toggle("paid")} />
        <MarkButton label="Picked up" on={marks.pickedUp} onClick={() => toggle("pickedUp")} />
      </div>
      {error && (
        <p className="mt-2 text-[14px] text-danger" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

function MarkButton({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-full border text-[15px] font-semibold transition-colors ${
        on
          ? "border-transparent bg-[var(--good-tint)] text-good"
          : "border-[var(--line)] bg-[var(--surface)] text-text"
      }`}
    >
      <span
        className={`grid size-6 place-items-center rounded-full border-2 ${
          on ? "border-transparent bg-[var(--good)] text-[var(--surface)]" : "border-[var(--muted)]"
        }`}
        aria-hidden="true"
      >
        {on && <Check size={14} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}
