import { asc } from "drizzle-orm";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { type StaffOrder, applyFilters, itemTotals, readFilters } from "@/lib/filters";
import { ITEMS } from "@/lib/menu";
import { isStaff } from "@/lib/staff-auth";
import { logout } from "./actions";
import { Filters } from "./filters";
import { LoginForm } from "./login-form";
import { OrderCard } from "./order-card";

export const metadata: Metadata = { title: "Orders · Porcafe staff", robots: { index: false } };

export default function StaffPage({ searchParams }: PageProps<"/staff">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
      <Suspense fallback={<div className="solid mx-auto h-64 max-w-md animate-pulse" aria-label="Loading" />}>
        <StaffContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StaffContent({ searchParams }: { searchParams: PageProps<"/staff">["searchParams"] }) {
  if (!(await isStaff())) return <LoginForm />;

  const filters = readFilters(await searchParams);
  await connection(); // Orders are read live on every request.
  const db = await getDb();
  const rows = await db.select().from(orders).orderBy(asc(orders.slot), asc(orders.id));
  const all: StaffOrder[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    slot: r.slot,
    notes: r.notes,
    items: r.items,
    total: r.total,
    paid: r.paidAt !== null,
    pickedUp: r.pickedUpAt !== null,
  }));
  const shown = applyFilters(all, filters);
  const paidCount = all.filter((o) => o.paid).length;
  const pickedCount = all.filter((o) => o.pickedUp).length;
  const item = ITEMS.find((i) => i.id === filters.item);
  const totals = item ? itemTotals(shown, item.id) : [];

  return (
    <div className="fade">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Porcafe staff</p>
          <h1 className="display text-[30px] font-bold leading-tight text-brand sm:text-[36px]">Orders</h1>
          <p className="num mt-1 text-[15px] text-muted">
            <strong className="text-text">{all.length}</strong> total · <strong className="text-text">{paidCount}</strong> paid ·{" "}
            <strong className="text-text">{pickedCount}</strong> picked up
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-soft min-h-11 px-4 text-[15px]">
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" /> Sign out
          </button>
        </form>
      </header>

      <Filters filters={filters} />

      {item && (
        <section className="solid mt-4 p-5" aria-label={`${item.name} totals`}>
          <p className="text-[15px] text-muted">
            {item.name} in {shown.length} {shown.length === 1 ? "order" : "orders"}
          </p>
          <p className="num mt-1 text-[20px] font-bold">
            {totals.length === 0
              ? "None"
              : totals.map((t, i) => (
                  <span key={t.variant}>
                    {i > 0 && <span className="font-normal text-muted"> · </span>}
                    {t.qty}
                    <span className="text-[16px] font-medium text-muted">{t.variant ? ` × ${t.variant}` : " pcs"}</span>
                  </span>
                ))}
          </p>
        </section>
      )}

      <p className="num mt-5 text-[15px] text-muted" aria-live="polite">
        Showing {shown.length} of {all.length}
      </p>
      {all.length === 0 ? (
        <p className="solid mt-3 p-6 text-center text-muted">No orders yet. They’ll show up here as customers order.</p>
      ) : shown.length === 0 ? (
        <p className="solid mt-3 p-6 text-center text-muted">No orders match these filters.</p>
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} highlightItem={filters.item} />
          ))}
        </ul>
      )}
    </div>
  );
}
