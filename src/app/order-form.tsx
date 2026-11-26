"use client";

import Image from "next/image";
import { ArrowDown, Minus, Plus } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { MENU, type Product, findProduct, formatRp } from "@/lib/menu";
import { type FieldErrors, MAX_QTY, lineLabel, newOrderKey } from "@/lib/order";
import { SLOTS, SLOT_DAYS, slotLabel } from "@/lib/settings";
import { type PlaceOrderState, placeOrder } from "./actions";

const initialState: PlaceOrderState = { errors: {} };

export function OrderForm() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [day, setDay] = useState(SLOT_DAYS[0]);
  const [slot, setSlot] = useState("");
  // Controlled, because React resets uncontrolled fields after a form action and typing must survive an error.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const keyRef = useRef<string | null>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const [state, formAction, pending] = useActionState(async (prev: PlaceOrderState, fd: FormData) => {
    // One key per order attempt: if a retry repeats a submit that already saved, the server returns the same order.
    keyRef.current ??= newOrderKey();
    fd.set("clientKey", keyRef.current);
    return placeOrder(prev, fd);
  }, initialState);
  const errors: FieldErrors = state.errors;

  const lines = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ product: findProduct(id)!, qty: n }))
        .filter((l) => l.product),
    [qty],
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.product.price, 0);
  const cartJson = JSON.stringify(lines.map((l) => ({ productId: l.product.id, qty: l.qty })));

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setDetailsVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function change(id: string, delta: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(MAX_QTY, (q[id] ?? 0) + delta)) }));
  }

  return (
    <form action={formAction} noValidate className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
      <div className="space-y-5">
        {MENU.map((cat, i) => (
          <section
            key={cat.id}
            aria-labelledby={`cat-${cat.id}`}
            className="glass fade overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {cat.imageShape === "rect" && (
              <Image
                src={cat.image}
                alt=""
                width={520}
                height={300}
                className="h-36 w-full object-cover sm:h-44"
                priority={i === 0}
              />
            )}
            <div className="px-5 pb-2 pt-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <h2 id={`cat-${cat.id}`} className="display text-[22px] font-semibold text-brand">
                  {cat.name}
                </h2>
                {cat.imageShape === "round" && (
                  <Image src={cat.image} alt="" width={64} height={64} className="size-14 rounded-full object-cover" />
                )}
              </div>
              <ul className="mt-1 divide-y divide-line">
                {cat.items.map((item) =>
                  item.products.length > 1 ? (
                    <li key={item.id} className="py-3">
                      <p className="text-[17px] font-semibold">{item.name}</p>
                      <ul>
                        {item.products.map((p) => (
                          <ProductRow key={p.id} product={p} label={p.variant} qty={qty[p.id] ?? 0} onChange={change} />
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <ProductRow
                      key={item.id}
                      product={item.products[0]}
                      label={item.name}
                      strong
                      qty={qty[item.products[0].id] ?? 0}
                      onChange={change}
                    />
                  ),
                )}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section
        id="details"
        ref={detailsRef}
        aria-labelledby="details-title"
        className="solid mt-6 scroll-mt-4 p-5 sm:p-6 lg:sticky lg:top-6 lg:mt-0"
      >
        {/* Hidden inputs live here, not at the top of the form, so they don't take cells in the desktop grid. */}
        <input type="hidden" name="cart" value={cartJson} />
        <input type="hidden" name="slot" value={slot} />
        <h2 id="details-title" className="display text-[22px] font-semibold text-brand">
          Your order
        </h2>

        {lines.length === 0 ? (
          <p className="mt-2 text-muted">Nothing added yet. Add anything you’d like from the menu.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[15px]">
            {lines.map((l) => (
              <li key={l.product.id} className="flex justify-between gap-3">
                <span>
                  <span className="num font-semibold">{l.qty}×</span> {lineLabel(l.product)}
                </span>
                <span className="num shrink-0 text-muted">{formatRp(l.qty * l.product.price)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-line pt-2 text-[17px] font-bold">
              <span>Total</span>
              <span className="num">{formatRp(total)}</span>
            </li>
          </ul>
        )}
        <FieldError id="cart-error" message={errors.cart} />

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-semibold">Name</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              autoComplete="name"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            <FieldError id="name-error" message={errors.name} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-semibold">WhatsApp number</span>
            <input
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812 3456 7890"
              className="field num"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            <FieldError id="phone-error" message={errors.phone} />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-[15px] font-semibold">Pickup time</legend>
            <div className="seg" role="radiogroup" aria-label="Pickup day">
              {SLOT_DAYS.map((d) => (
                <label key={d}>
                  <input type="radio" name="pickup-day" checked={day === d} onChange={() => setDay(d)} />
                  <span>{d}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Pickup slots on ${day}`}>
              {SLOTS.filter((s) => s.day === day).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={slot === s.id}
                  onClick={() => setSlot(s.id)}
                  className="chip"
                >
                  {s.label}
                </button>
              ))}
            </div>
            {slot && <p className="mt-2 text-[15px] text-muted">Picking up {slotLabel(slot)}</p>}
            <FieldError id="slot-error" message={errors.slot} />
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-[15px] font-semibold">
              Notes <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} className="field resize-none" placeholder="Anything we should know?" />
            <FieldError id="notes-error" message={errors.notes} />
          </label>
        </div>

        <div aria-live="polite">
          {errors.form && <p className="mt-4 rounded-xl bg-[var(--danger-tint)] px-4 py-3 text-[15px] text-danger">{errors.form}</p>}
          {!errors.form && Object.keys(errors).length > 0 && (
            <p className="mt-4 text-[15px] text-danger">Please fix the highlighted fields above.</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
          {pending ? "Placing order…" : count > 0 ? `Place order · ${formatRp(total)}` : "Place order"}
        </button>
        <p className="mt-3 text-center text-[14px] text-muted">You’ll get the payment details on the next screen.</p>
      </section>

      {count > 0 && !detailsVisible && (
        <div className="fixed inset-x-3 bottom-3 z-10 lg:hidden">
          <a href="#details" className="glass flex items-center justify-between gap-3 p-2 pl-5" style={{ borderRadius: 22 }}>
            <span className="num text-[15px]">
              <span className="font-bold">{count} {count === 1 ? "item" : "items"}</span>
              <span className="text-muted"> · {formatRp(total)}</span>
            </span>
            <span className="btn btn-primary min-h-11">
              Checkout <ArrowDown size={18} strokeWidth={2} aria-hidden="true" />
            </span>
          </a>
        </div>
      )}
    </form>
  );
}

function ProductRow({
  product,
  label,
  strong,
  qty,
  onChange,
}: {
  product: Product;
  label: string;
  strong?: boolean;
  qty: number;
  onChange: (id: string, delta: number) => void;
}) {
  const name = lineLabel(product);
  return (
    <li className="flex min-h-[64px] items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className={strong ? "text-[17px] font-semibold" : "text-[16px]"}>{label}</p>
        <p className="num text-[15px] text-muted">{formatRp(product.price)}</p>
      </div>
      {qty === 0 ? (
        <button type="button" className="btn btn-soft min-h-11 shrink-0 px-4" onClick={() => onChange(product.id, 1)} aria-label={`Add ${name}`}>
          <Plus size={18} strokeWidth={2} aria-hidden="true" /> Add
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-tint)] p-1">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-[var(--accent-strong)] hover:bg-[var(--surface)]"
            onClick={() => onChange(product.id, -1)}
            aria-label={`One less ${name}`}
          >
            <Minus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="num w-7 text-center font-bold" aria-live="polite" aria-label={`${qty} ${name}`}>
            {qty}
          </span>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-[var(--accent-strong)] hover:bg-[var(--surface)] disabled:opacity-40"
            onClick={() => onChange(product.id, 1)}
            disabled={qty >= MAX_QTY}
            aria-label={`One more ${name}`}
          >
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[14px] text-danger">
      {message}
    </p>
  );
}
