import { expect, test } from "@playwright/test";
import { ACCOUNTS, reseed, session, settle } from "./support";

test.beforeEach(reseed);

test("a settings change is saved and recorded in the audit log", async ({ browser }) => {
  const page = await session(browser, ACCOUNTS.superadmin);
  await page.goto("/superadmin-system");
  await page.locator("label", { hasText: "Platform commission" }).locator("input").fill("12.5");
  await expect(page.getByText("1 unsaved change")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Settings saved/)).toBeVisible();

  await page.locator("label", { hasText: "Maximum length" }).locator("input").fill("999");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("main")).toContainText(/365/);

  await page.goto("/superadmin-audit-logs");
  await expect(page.locator("main")).toContainText("Changed Platform commission from 0.1 to 0.125");
});

test("closing dealer sign-up hides it on the sign-up page", async ({ browser }) => {
  const page = await session(browser, ACCOUNTS.superadmin);
  await page.goto("/superadmin-system");
  await page.getByRole("switch", { name: "Dealer sign-up" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await settle(page);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/register");
  await expect(visitor.getByText("Customer", { exact: true })).toBeVisible();
  await expect(visitor.getByText("Car Dealer")).toHaveCount(0);
});

test("maintenance mode locks out customers but not super admins", async ({ browser }) => {
  const page = await session(browser, ACCOUNTS.superadmin);
  await page.goto("/superadmin-system");
  await page.getByRole("switch", { name: "Maintenance mode" }).click();
  await page.getByRole("dialog", { name: "Turn on maintenance mode" }).getByRole("button", { name: "Turn on" }).click();
  await page.locator("label", { hasText: "Message shown while locked" }).locator("input").fill("Back by 6pm.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await settle(page);

  const customer = await (await browser.newContext()).newPage();
  await customer.goto("/login");
  await expect(customer.getByText("Back by 6pm.")).toBeVisible();
  await customer.getByLabel("Email Address").fill(ACCOUNTS.customer);
  await customer.getByLabel("Password").first().fill("password");
  await customer.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(customer).toHaveURL(/\/login/);

  await page.goto("/dashboard");
  await expect(page.getByText(/Maintenance mode is on/)).toBeVisible();
});
