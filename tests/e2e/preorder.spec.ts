import { type Page, expect, test } from "@playwright/test";

// One story, in order: two customers preorder, then staff filter, search and tick.
test.describe.configure({ mode: "serial" });

let ayuOrderUrl = "";

async function add(page: Page, name: string, times = 1) {
  await page.getByRole("button", { name: `Add ${name}` }).click();
  for (let i = 1; i < times; i++) await page.getByRole("button", { name: `One more ${name}` }).click();
}

test("customer places an order, and typing survives a validation error", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PORCAFE" })).toBeVisible();

  await add(page, "Pork Sate (5 skewers)", 2);
  // The checkout bar shows while the order form is off screen.
  await expect(page.getByRole("link", { name: /2 items · Rp120\.000/ })).toBeVisible();
  await add(page, "Coffee Jelly Latte");
  await expect(page.getByRole("listitem").filter({ hasText: "Total" })).toContainText("Rp145.000");

  await page.getByRole("textbox", { name: "Name" }).fill("Ayu Test");
  await page.getByRole("textbox", { name: "WhatsApp number" }).fill("0812 3456 7890");
  await page.getByRole("button", { name: /Place order/ }).click();

  // No pickup time chosen: error shown, typed fields kept.
  await expect(page.getByText("Please choose a pickup time.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Ayu Test");

  await page.getByRole("radio", { name: "Fri 4 Dec" }).check();
  await page.getByRole("radio", { name: "10:00–11:00" }).click();
  await page.getByRole("button", { name: "Place order · Rp145.000" }).click();

  await expect(page.getByRole("heading", { name: "Thank you, Ayu Test!" })).toBeVisible();
  await expect(page.getByText("PC-001").first()).toBeVisible();
  await expect(page.getByText("Pickup Fri 4 Dec, 10:00–11:00")).toBeVisible();
  await expect(page.getByText("Waiting for transfer")).toBeVisible();
  ayuOrderUrl = page.url();
});

test("a second customer orders", async ({ page }) => {
  await page.goto("/");
  await add(page, "Samcan Telur");
  await page.getByRole("textbox", { name: "Name" }).fill("Budi Test");
  await page.getByRole("textbox", { name: "WhatsApp number" }).fill("+62 811 2222 333");
  await page.getByRole("radio", { name: "09:00–10:00" }).click();
  await page.getByRole("button", { name: "Place order · Rp60.000" }).click();
  await expect(page.getByRole("heading", { name: "Thank you, Budi Test!" })).toBeVisible();
});

test("staff sign in, filter by item, search, and tick paid and picked up", async ({ page }) => {
  await page.goto("/staff");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();
  await page.getByLabel("Password").fill("e2e-staff-pass");
  await page.getByRole("button", { name: "Sign in" }).click();

  const cards = page.getByTestId("order-card");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(cards).toHaveCount(2);

  // Who ordered Pork Sate, and how many.
  await page.getByRole("combobox").selectOption("pork-sate");
  await expect(page).toHaveURL(/item=pork-sate/);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Ayu Test");
  await expect(page.getByLabel("Pork Sate totals")).toContainText("2 × 5 skewers");

  // Everything one person ordered.
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(2);
  await page.getByRole("searchbox").fill("budi");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("1× Samcan Telur");
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(2);

  // Tick Ayu paid, Budi picked up.
  const ayu = cards.filter({ hasText: "Ayu Test" });
  await ayu.getByRole("checkbox", { name: "Paid" }).click();
  await expect(ayu.getByRole("checkbox", { name: "Paid" })).toHaveAttribute("aria-checked", "true");
  const budi = cards.filter({ hasText: "Budi Test" });
  await budi.getByRole("checkbox", { name: "Picked up" }).click();
  await expect(budi.getByRole("checkbox", { name: "Picked up" })).toHaveAttribute("aria-checked", "true");

  // Marks are saved, and the filters use them.
  await page.reload();
  await page.getByRole("radiogroup", { name: "Payment" }).getByRole("radio", { name: "Unpaid" }).check();
  await expect(page).toHaveURL(/paid=no/);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Budi Test");

  await page.getByRole("link", { name: "Clear filters" }).click();
  await page.getByRole("radiogroup", { name: "Pickup" }).getByRole("radio", { name: "Not picked up" }).check();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Ayu Test");

  // Untick works too.
  await cards.first().getByRole("checkbox", { name: "Paid" }).click();
  await expect(cards.first().getByRole("checkbox", { name: "Paid" })).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(cards.first().getByRole("checkbox", { name: "Paid" })).toHaveAttribute("aria-checked", "false");
  await cards.first().getByRole("checkbox", { name: "Paid" }).click();
  await expect(cards.first().getByRole("checkbox", { name: "Paid" })).toHaveAttribute("aria-checked", "true");
});

test("the customer's page shows the payment as received", async ({ page }) => {
  await page.goto(ayuOrderUrl);
  await expect(page.getByText("Received", { exact: true })).toBeVisible();
});

test("staff actions refuse a signed-out visitor", async ({ page }) => {
  await page.goto("/staff");
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByTestId("order-card")).toHaveCount(0);
});
