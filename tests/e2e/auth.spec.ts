import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, reseed } from "./support";

test.beforeAll(reseed);

for (const [role, email] of Object.entries(ACCOUNTS)) {
  test(`${role} signs in and lands on their dashboard`, async ({ page }) => {
    await login(page, email);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });
}

test("wrong password is refused with a clear message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(ACCOUNTS.customer);
  await page.getByLabel("Password").first().fill("not-the-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/credentials do not match|incorrect/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("a suspended account can't sign in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("moses.k@swiftcarhire.co.ke");
  await page.getByLabel("Password").first().fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/suspended/i)).toBeVisible();
});

test("a new customer can sign up", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First Name").fill("Wanjiru");
  await page.getByLabel("Last Name").fill("Test");
  await page.getByLabel("Email Address").fill(`wanjiru.${Date.now()}@example.com`);
  await page.getByLabel("Phone Number").fill("0712345678");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('input[type="password"]').nth(0).fill("Password123!");
  await page.locator('input[type="password"]').nth(1).fill("Password123!");
  await page.getByRole("button", { name: /Create account|Create Account|Sign up/ }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText(/Welcome back, Wanjiru/)).toBeVisible();
});
