import { type Page, test } from "@playwright/test";

const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } } as const;
const schemes = ["light", "dark"] as const;

async function order(page: Page, items: string[], name: string, slot: string) {
  await page.goto("/");
  for (const i of items) await page.getByRole("button", { name: `Add ${i}` }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("textbox", { name: "WhatsApp number" }).fill("0812 3456 7890");
  await page.getByRole("radio", { name: slot }).first().click();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.getByRole("heading", { name: /Thank you/ }).waitFor();
  return page.url();
}

test("screens", async ({ browser }) => {
  test.setTimeout(180_000);
  const setup = await browser.newPage();
  const orderUrl = await order(setup, ["Pork Sate (10 skewers)", "Biscoff Cookie Butter", "Coffee Jelly Latte"], "Maria Christina Wijayakusuma", "11:00–12:00");
  await order(setup, ["Sate Samcan (5 skewers)", "Samcan Telur"], "Budi", "09:00–10:00");
  await order(setup, ["Pork Sate (5 skewers)"], "Kevin", "13:00–14:00");
  await setup.close();

  let first = true;
  for (const [size, viewport] of Object.entries(sizes)) {
    for (const colorScheme of schemes) {
      const ctx = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const shot = (n: string, fullPage = false) =>
        page.screenshot({ path: `screenshots/${n}-${size}-${colorScheme}.png`, fullPage });

      await page.goto("/");
      await page.waitForTimeout(600);
      await shot("1-home");
      await page.getByRole("button", { name: "Add Pork Sate (5 skewers)" }).click();
      await page.getByRole("button", { name: "One more Pork Sate (5 skewers)" }).click();
      await page.getByRole("button", { name: "Add Matcha White Chocolate" }).click();
      await page.getByRole("button", { name: /Place order/ }).click();
      await page.getByText("Please choose a pickup time.").waitFor();
      await shot("2-home-full", true);

      await page.goto(orderUrl);
      await page.getByRole("heading", { name: /Thank you/ }).waitFor();
      await page.waitForTimeout(500);
      await shot("3-confirmation", true);

      await page.goto("/staff");
      await page.getByLabel("Password").waitFor();
      await page.waitForTimeout(600);
      await shot("4-staff-login");
      await page.getByLabel("Password").fill("e2e-staff-pass");
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.getByRole("heading", { name: "Orders" }).waitFor();
      if (first) await page.getByTestId("order-card").first().getByRole("checkbox", { name: "Paid" }).click();
      first = false;
      await page.waitForTimeout(800);
      await shot("5-staff", true);
      await page.goto("/staff?item=pork-sate");
      await page.getByLabel("Pork Sate totals").waitFor();
      await page.waitForTimeout(500);
      await shot("6-staff-item", true);
      await ctx.close();
    }
  }
});
