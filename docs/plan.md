# Porcafe bazaar preorders: plan

Light build (owner, 2026-11-26). English UI. Bazaar Thu 3 and Fri 4 Dec 2026.

## What it does
- **Customers (`/`):** add items from the menu, enter name and WhatsApp number, pick a pickup slot, place the order.
  Then `/order/<code>` shows the order number, total, payment details and whether the payment has been received.
- **Staff (`/staff`, shared password):** every order, sorted by pickup slot. Filter by menu item (with totals per size),
  search by name, phone or order number, filter paid / unpaid and picked up / not yet. Tick an order paid or picked up
  (and untick).

## Decisions
- Payment is by transfer or QRIS before pickup; staff tick "paid" by hand. No payments go through the app.
- No stock limits. Max 99 of one item per order (typo guard).
- Pickup slots: 1 hour each, Thu 09:00–15:00 and Fri 09:00–18:00 (`src/lib/settings.ts`).
- Prices are read from `src/lib/menu.ts` on the server; what the browser sends is never trusted.
- A retried submit can't create a second order (one key per attempt, unique in the database).
- Colours from the Porcafe menu instead of the default blue taste, since the page is the shop's.
- Local dev and tests use PGlite in `.data/` (never Neon); production uses Neon over HTTP.

## Waiting for the owner
| What | Since | Blocks |
|---|---|---|
| When preorders close (`ORDERS_CLOSE_AT`) | 2026-11-26 | Nothing (open until set) |
| Neon login (`neon login`), then the staff password for Vercel | 2026-11-26 | Going live |
| OK to create the GitHub repo and Vercel project | 2026-11-26 | Going live |

## Follow-ups offered, not built
Filter by pickup day or slot with a prep list, Excel/CSV export, deleting or editing an order from the staff page.
