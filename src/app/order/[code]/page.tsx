import { eq } from "drizzle-orm";
import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { formatRp } from "@/lib/menu";
import { lineLabel, orderNumber } from "@/lib/order";
import { PAYMENT, paymentReady, slotLabel } from "@/lib/settings";

export const metadata: Metadata = { title: "Your order · Porcafe", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/order/[code]">) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-12 pt-8 sm:px-6">
      <Suspense fallback={<div className="solid h-96 animate-pulse" aria-label="Loading your order" />}>
        <OrderDetails params={params} />
      </Suspense>
    </main>
  );
}

async function OrderDetails({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await connection(); // Always read the live order, never a prerendered copy.
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  if (!order) notFound();
  const number = orderNumber(order.id);

  return (
    <div className="fade space-y-5">
      <header className="text-center">
        <CheckCircle2 className="mx-auto text-good" size={44} strokeWidth={1.7} aria-hidden="true" />
        <h1 className="display mt-2 text-[30px] font-bold leading-tight text-brand">Thank you, {order.name}!</h1>
        <p className="mt-1 text-muted">
          Your order number is <strong className="num whitespace-nowrap text-text">{number}</strong>. Save this page to check on it later.
        </p>
      </header>

      <section className="solid p-5 sm:p-6" aria-labelledby="pay-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="pay-title" className="display text-[20px] font-semibold text-brand">
            Payment
          </h2>
          {order.paidAt ? (
            <span className="tag bg-[var(--good-tint)] text-good">Received</span>
          ) : (
            <span className="tag bg-[var(--warn-tint)] text-[var(--warn)]">Waiting for transfer</span>
          )}
        </div>
        {order.paidAt ? (
          <p className="mt-2">We’ve received your payment. See you at the bazaar!</p>
        ) : (
          <>
            <p className="mt-2">
              Please transfer <strong className="num">{formatRp(order.total)}</strong> and write{" "}
              <strong className="num whitespace-nowrap">{number}</strong> in the transfer note.
            </p>
            {paymentReady() ? (
              <dl className="mt-4 space-y-2 rounded-2xl bg-[var(--accent-tint)] p-4 text-[15px]">
                {PAYMENT.bank && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Bank</dt>
                    <dd className="font-semibold">{PAYMENT.bank}</dd>
                  </div>
                )}
                {PAYMENT.accountNumber && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Account number</dt>
                    <dd className="num font-semibold">{PAYMENT.accountNumber}</dd>
                  </div>
                )}
                {PAYMENT.accountName && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Account name</dt>
                    <dd className="font-semibold">{PAYMENT.accountName}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl bg-[var(--accent-tint)] p-4 text-[15px]">
                Our bank details will be sent to you on WhatsApp.
              </p>
            )}
            {PAYMENT.qrisImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={PAYMENT.qrisImage} alt="QRIS code for payment" className="mx-auto mt-4 w-full max-w-xs rounded-2xl" />
            )}
          </>
        )}
      </section>

      <section className="solid p-5 sm:p-6" aria-labelledby="order-title">
        <h2 id="order-title" className="display text-[20px] font-semibold text-brand">
          Your order
        </h2>
        <ul className="mt-3 space-y-1.5 text-[15px]">
          {order.items.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span>
                <span className="num font-semibold">{l.qty}×</span> {lineLabel(l)}
              </span>
              <span className="num shrink-0 text-muted">{formatRp(l.qty * l.unitPrice)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-line pt-2 text-[17px] font-bold">
            <span>Total</span>
            <span className="num">{formatRp(order.total)}</span>
          </li>
        </ul>
        <p className="mt-4 flex items-center gap-2 text-[15px]">
          <Clock size={18} strokeWidth={1.7} className="text-accent" aria-hidden="true" />
          Pickup {slotLabel(order.slot)}
        </p>
        {order.notes && <p className="mt-2 text-[15px] text-muted">Notes: {order.notes}</p>}
      </section>

      <p className="text-center">
        <Link href="/" className="btn btn-soft">
          Back to the menu
        </Link>
      </p>
    </div>
  );
}
