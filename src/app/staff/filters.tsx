"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { Filters as FilterValues } from "@/lib/filters";
import { MENU } from "@/lib/menu";

// A plain GET form: filters live in the address, so a link reproduces the view.
// Selects and switches apply straight away; search applies on Enter or the button.
export function Filters({ filters }: { filters: FilterValues }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function apply() {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form)) {
      if (typeof v === "string" && v && v !== "all") params.set(k, v.trim());
    }
    const s = params.toString();
    router.replace(s ? `/staff?${s}` : "/staff", { scroll: false });
  }

  const active = filters.q || filters.item || filters.paid !== "all" || filters.picked !== "all";

  return (
    <form
      ref={formRef}
      role="search"
      className="glass mt-5 space-y-3 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      key={JSON.stringify(filters)}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search by name, phone or order number</span>
            <Search
              size={18}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Name, phone or PC-012"
              className="field pl-11"
              enterKeyHint="search"
            />
          </label>
          <button type="submit" className="btn btn-soft shrink-0 px-4">
            Search
          </button>
        </div>
        <label className="block">
          <span className="sr-only">Menu item</span>
          <select name="item" defaultValue={filters.item} onChange={apply} className="field">
            <option value="">All menu items</option>
            {MENU.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented
          name="paid"
          label="Payment"
          value={filters.paid}
          onChange={apply}
          options={[
            ["all", "All"],
            ["no", "Unpaid"],
            ["yes", "Paid"],
          ]}
        />
        <Segmented
          name="picked"
          label="Pickup"
          value={filters.picked}
          onChange={apply}
          options={[
            ["all", "All"],
            ["no", "Not picked up"],
            ["yes", "Picked up"],
          ]}
        />
      </div>
      {active && (
        <Link href="/staff" replace scroll={false} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent">
          <X size={16} strokeWidth={2} aria-hidden="true" /> Clear filters
        </Link>
      )}
    </form>
  );
}

function Segmented({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
  onChange: () => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <label key={v}>
          <input type="radio" name={name} value={v} defaultChecked={value === v} onChange={onChange} />
          <span>{text}</span>
        </label>
      ))}
    </div>
  );
}
