import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, failOnPageErrors, fixture, reseed, session, settle } from "./support";

/** A datetime-local value `days` from now at 10:00. */
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
};

test.describe.configure({ mode: "serial" });

let customer: Page;
let dealer: Page;

test.beforeAll(async ({ browser }) => {
  reseed();
  customer = await session(browser, ACCOUNTS.customer);
  dealer = await session(browser, ACCOUNTS.dealer);
});

test("the dealer's rental policy is editable and shown to customers before booking", async () => {
  const errors = failOnPageErrors(dealer);
  await dealer.goto("/dealer-account");
  await dealer.getByRole("button", { name: "Rental Policy" }).click();
  await dealer.getByLabel("Security deposit").fill("12000");
  await dealer.getByRole("button", { name: "Save policy" }).click();
  await expect(dealer.getByText("Saved")).toBeVisible();

  await customer.goto("/customer-browse");
  await customer.getByPlaceholder("Search make or model...").fill("Honda Fit");
  await customer.getByRole("button", { name: /Book Now/ }).first().click();
  await expect(customer.getByRole("dialog", { name: "Book Honda Fit" })).toContainText("KSh 12,000 refundable deposit at pickup");
  await customer.keyboard.press("Escape");
  errors();
});

test("handover takes the deposit; the return adds charges and the deposit covers them", async () => {
  const errors = failOnPageErrors(dealer);

  // Customer books; the deposit set above is snapshotted on the booking.
  await customer.goto("/customer-browse");
  await customer.getByPlaceholder("Search make or model...").fill("Honda Fit");
  await customer.getByRole("button", { name: /Book Now/ }).first().click();
  const book = customer.getByRole("dialog", { name: "Book Honda Fit" });
  await book.locator('input[type="datetime-local"]').nth(0).fill(daysFromNow(40));
  await book.locator('input[type="datetime-local"]').nth(1).fill(daysFromNow(42));
  await book.getByLabel("Pickup location").fill("Westlands");
  await book.getByRole("button", { name: "Request booking" }).click();
  await expect(book.getByText("Booking requested")).toBeVisible();
  const reference = (await book.locator("span.font-mono").first().innerText()).trim();

  // Dealer confirms, then hands over with condition photos and the deposit.
  await dealer.goto("/dealer-booking");
  await dealer.getByLabel("Search bookings").fill(reference);
  await settle(dealer);
  const row = dealer.locator("tr", { hasText: reference });
  await row.getByRole("button", { name: "Confirm" }).click();
  await settle(dealer);
  await row.getByRole("button", { name: "Hand over keys" }).click();
  const handover = dealer.getByRole("dialog", { name: "Hand over keys" });
  await handover.getByLabel(/Odometer/).fill("52000");
  await handover.getByLabel("Fuel level").fill("80");
  await handover.getByLabel("Condition photos").setInputFiles(fixture("damage.jpg"));
  await expect(handover.getByLabel(/Deposit received/)).toHaveValue("12000");
  await handover.getByLabel("M-PESA code").fill("DEP" + Date.now().toString().slice(-6));
  await handover.getByRole("button", { name: "Hand over keys" }).click();
  await expect(handover).toBeHidden();
  await expect(row).toContainText("KSh 12,000 deposit held");

  // Back with 20% less fuel: 20 × KSh 150 = 3,000 + VAT. The deposit pays toward the balance.
  await row.getByRole("button", { name: "Mark returned" }).click();
  const ret = dealer.getByRole("dialog", { name: "Check the car back in" });
  await ret.getByLabel(/Odometer/).fill("52300");
  await ret.getByLabel("Fuel level").fill("60");
  await expect(ret.getByText("Fuel", { exact: true })).toBeVisible();
  await expect(ret).toContainText("KSh 3,480");
  await expect(ret).toContainText("Used for what's owed");
  await ret.getByRole("button", { name: "Complete return" }).click();
  await expect(ret).toBeHidden();
  await expect(row).toContainText("+KSh 3,480 return charges");
  await expect(row).not.toContainText("deposit held");

  // The charge is a line on the invoice and the customer sees it too.
  await customer.goto("/customer-rentals");
  await expect(customer.locator("main")).toContainText("+KSh 3,480 return charges");
  errors();
});

test("a customer asks for more time and the dealer approves it", async () => {
  const errors = failOnPageErrors(customer);
  await customer.goto("/customer-active-trip");
  await customer.getByRole("button", { name: "Extend rental" }).click();
  const ask = customer.getByRole("dialog", { name: "Extend your rental" });
  await expect(ask).toContainText("1 extra day");
  await ask.getByRole("button", { name: "Send request" }).click();
  await expect(customer.getByText(/waiting for the dealer/)).toBeVisible();

  await dealer.goto("/dealer-booking");
  await settle(dealer);
  await dealer.getByRole("button", { name: /Extension \+1d/ }).click();
  const decide = dealer.getByRole("dialog", { name: "Extension request" });
  await decide.getByRole("button", { name: "Approve" }).click();
  await expect(decide).toBeHidden();

  await customer.reload();
  await expect(customer.getByText(/Extension approved/)).toBeVisible();
  errors();
});
