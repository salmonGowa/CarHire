import { expect, test } from "@playwright/test";
import { ACCOUNTS, failOnPageErrors, login, reseed, settle } from "./support";

/** A datetime-local value `days` from now at 10:00. */
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
};

test.beforeAll(reseed);

test("customer books, dealer confirms and records payment, customer sees it paid", async ({ browser }) => {
  // Customer requests a booking.
  const customer = await (await browser.newContext()).newPage();
  const customerErrors = failOnPageErrors(customer);
  await login(customer, ACCOUNTS.customer);
  await customer.goto("/customer-browse");
  await customer.getByPlaceholder("Search make or model...").fill("Honda Fit");
  await customer.getByRole("button", { name: /Book Now/ }).first().click();
  const dialog = customer.getByRole("dialog", { name: "Book Honda Fit" });
  const [pickup, ret] = [dialog.locator('input[type="datetime-local"]').nth(0), dialog.locator('input[type="datetime-local"]').nth(1)];
  await pickup.fill(daysFromNow(30));
  await ret.fill(daysFromNow(33));
  await dialog.getByLabel("Pickup location").fill("Westlands");
  await dialog.getByRole("button", { name: "Request booking" }).click();
  await expect(dialog.getByText("Booking requested")).toBeVisible();
  const reference = (await dialog.locator("span.font-mono").first().innerText()).trim();
  expect(reference).toMatch(/^BKG-/);

  // Dealer confirms it and records an M-PESA payment for the full balance.
  const dealer = await (await browser.newContext()).newPage();
  const dealerErrors = failOnPageErrors(dealer);
  await login(dealer, ACCOUNTS.dealer);
  await expect(dealer.getByRole("button", { name: /Notifications \(\d+ unread\)/ })).toBeVisible();
  await dealer.goto("/dealer-booking");
  await dealer.getByLabel("Search bookings").fill(reference);
  await settle(dealer);
  const row = dealer.locator("tr", { hasText: reference });
  await row.getByRole("button", { name: "Confirm" }).click();
  await settle(dealer);
  await row.getByRole("button", { name: "Record payment" }).click();
  const pay = dealer.getByRole("dialog", { name: "Record payment" });
  await pay.getByLabel("M-PESA transaction code").fill("SKE2E" + Date.now().toString().slice(-5));
  await pay.getByRole("button", { name: /^Record KSh/ }).click();
  await settle(dealer);
  await expect(row).toContainText(/paid/i);

  // The customer is notified and the invoice shows as paid.
  await customer.goto("/customer-billing");
  await expect(customer.getByRole("button", { name: /Notifications \(\d+ unread\)/ })).toBeVisible();
  await expect(customer.locator("main")).toContainText("Paid");

  customerErrors();
  dealerErrors();
});

test("a customer can't book a vehicle that is already taken for those dates", async ({ page }) => {
  await login(page, ACCOUNTS.customer);
  await page.goto("/customer-browse");
  await page.getByPlaceholder("Search make or model...").fill("Honda Fit");
  await page.getByRole("button", { name: /Book Now/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Book Honda Fit" });
  // The seed data books the Honda Fit from tomorrow, which is the form's default pickup.
  await dialog.getByRole("button", { name: "Request booking" }).click();
  await expect(dialog.getByText("This vehicle is already booked for those dates.")).toBeVisible();
});
