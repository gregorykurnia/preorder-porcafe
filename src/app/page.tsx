import { TreePine } from "lucide-react";
import { ordersOpen } from "@/lib/settings";
import { OrderForm } from "./order-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <header className="fade mb-7 text-center">
        <p className="tag bg-[var(--good-tint)] text-good">
          <TreePine size={15} strokeWidth={2} aria-hidden="true" /> Christmas Bazaar · 3–4 Dec
        </p>
        <h1 className="display mt-3 text-[44px] font-bold leading-none tracking-tight text-brand sm:text-[56px]">PORCAFE</h1>
        <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">The best pork satay in Bandung</p>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed">
          Preorder now and pick up at our booth on <strong>Thursday 3</strong> or <strong>Friday 4 December</strong>.
        </p>
      </header>

      {ordersOpen() ? (
        <OrderForm />
      ) : (
        <div className="solid mx-auto max-w-md p-6 text-center">
          <h2 className="display text-[22px] font-semibold text-brand">Preorders are closed</h2>
          <p className="mt-2 text-muted">Thank you! Come and find us at the bazaar.</p>
        </div>
      )}
    </main>
  );
}
