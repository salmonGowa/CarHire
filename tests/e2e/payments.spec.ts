import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, failOnPageErrors, reseed, session } from "./support";

// Uses the simulated providers (MPESA_DRIVER / CARD_DRIVER = simulate): prompts
// are approved after a few seconds, and the card checkout is a test page.

test.describe.configure({ mode: "serial" });

let customer: Page;
let dealer: Page;

test.beforeAll(async ({ browser }) => {
  reseed();
  customer = await session(browser, ACCOUNTS.customer);
  dealer = await session(browser, ACCOUNTS.dealer);
});

/** The first invoice row with a Pay button; returns the dialog after opening it. */
async function openPay(page: Page) {
  await page.goto("/customer-billing");
  await page.getByRole("button", { name: /^Pay KSh/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Pay now" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("a cancelled M-PESA prompt says so and can be retried", async () => {
  const errors = failOnPageErrors(customer);
  const pay = await openPay(customer);
  await pay.getByLabel(/M-PESA number/).fill("0712 345 000"); // the simulator cancels numbers ending 000
  await pay.getByRole("button", { name: /Send M-PESA prompt/ }).click();
  await expect(pay.getByText("Check your phone")).toBeVisible();
  await expect(pay.getByText("Payment didn't go through")).toBeVisible({ timeout: 15_000 });
  await expect(pay).toContainText("cancelled on the phone");
  await pay.getByRole("button", { name: "Try again" }).click();
  await expect(pay.getByLabel(/M-PESA number/)).toBeVisible();
  await customer.keyboard.press("Escape");
  errors();
});

test("customer pays part of a balance by M-PESA and the receipt appears", async () => {
  const errors = failOnPageErrors(customer);
  const pay = await openPay(customer);
  await expect(pay.getByLabel(/M-PESA number/)).toHaveValue("0712345678"); // saved under Payment Details
  await pay.getByLabel(/Amount/).fill("1000");
  await pay.getByRole("button", { name: /Send M-PESA prompt/ }).click();
  await expect(pay).toContainText("Simulated M-PESA");
  await expect(pay.getByText("KSh 1,000 received")).toBeVisible({ timeout: 15_000 });
  await expect(pay).toContainText(/M-PESA receipt SIM/);
  await pay.getByRole("button", { name: "Done" }).click();
  await expect(customer.locator("main")).toContainText("KSh 1,000");
  errors();
});

test("customer pays by card through the checkout page", async () => {
  const errors = failOnPageErrors(customer);
  const pay = await openPay(customer);
  await pay.getByRole("button", { name: "Card", exact: true }).click();
  await pay.getByLabel(/Amount/).fill("2500");
  await pay.getByRole("button", { name: /Continue to card payment/ }).click();
  await customer.waitForURL("**/payments/card/simulate/**");
  await expect(customer.getByText("no money moves")).toBeVisible();
  await customer.getByRole("button", { name: "Pay KSh 2,500" }).click();
  await customer.waitForURL("**/customer-billing?payment=*");
  await expect(customer.getByRole("status").filter({ hasText: "KSh 2,500 paid by card" })).toBeVisible();
  errors();
});

test("the dealer is told and can send a prompt to the customer's phone", async () => {
  const errors = failOnPageErrors(dealer);
  await dealer.goto("/dealer-booking");
  await expect(dealer.getByRole("button", { name: /Notifications \(\d+ unread\)/ })).toBeVisible();
  await dealer.getByRole("button", { name: "Record payment" }).first().click();
  await dealer.getByRole("dialog", { name: "Record payment" }).getByRole("button", { name: /Send an M-PESA prompt/ }).click();
  const prompt = dealer.getByRole("dialog", { name: "Send M-PESA prompt" });
  await expect(prompt.getByRole("button", { name: "Card", exact: true })).toHaveCount(0); // card is the customer's own checkout
  await prompt.getByLabel(/M-PESA number/).fill("0712345678");
  await prompt.getByLabel(/Amount/).fill("500");
  await prompt.getByRole("button", { name: /Send prompt/ }).click();
  await expect(prompt.getByText("Prompt sent")).toBeVisible();
  await expect(prompt.getByText("KSh 500 received")).toBeVisible({ timeout: 15_000 });
  errors();
});

test("a manager sets payout details with their password", async () => {
  const errors = failOnPageErrors(dealer);
  await dealer.goto("/dealer-account");
  await dealer.getByRole("button", { name: "Payouts" }).click();
  await dealer.getByRole("button", { name: /payout details/ }).click();
  await dealer.getByLabel("Account name").fill("Swift Car Hire Ltd");
  await dealer.getByLabel("Bank", { exact: true }).fill("KCB");
  await dealer.getByLabel("Branch").fill("Kenyatta Avenue");
  await dealer.getByLabel("Account number").fill("1122334455");
  await dealer.getByLabel("Your password").fill("wrong-password");
  await dealer.getByRole("button", { name: "Save payout details" }).click();
  await expect(dealer.getByText("That isn't your password.")).toBeVisible();
  await dealer.getByLabel("Your password").fill("password");
  await dealer.getByRole("button", { name: "Save payout details" }).click();
  await expect(dealer.getByText("KCB, Kenyatta Avenue · 1122334455 (Swift Car Hire Ltd)")).toBeVisible();
  await expect(dealer.getByText(/Changed in the last 48 hours/)).toBeVisible();
  errors();
});
