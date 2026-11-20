import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { reseed } from "./support";

test.beforeAll(reseed);

/** A real reset token, as the emailed link would carry (the mailer only logs in tests). */
const resetToken = (email: string) =>
  execSync(`php artisan tinker --execute="echo Password::createToken(App\\\\Models\\\\User::where('email', '${email}')->first());"`).toString().trim();

test("forgot password, set a new one from the link, sign in with it", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/forgot-password/);
  await page.getByLabel("Email Address").fill("sarah@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("reset link is on its way");

  await page.goto(`/reset-password?token=${resetToken("sarah@example.com")}&email=sarah@example.com`);
  await page.getByLabel("New password", { exact: false }).first().fill("BrandNew123!");
  await page.getByLabel("Confirm new password").fill("BrandNew123!");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/login\?reset=1/);
  await expect(page.getByRole("status")).toContainText("password has been changed");

  await page.getByLabel("Email Address").fill("sarah@example.com");
  await page.getByLabel("Password").first().fill("BrandNew123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
});

test("an expired or wrong reset link explains what to do", async ({ page }) => {
  await page.goto("/reset-password?token=not-a-real-token&email=sarah@example.com");
  await page.getByLabel("New password", { exact: false }).first().fill("Whatever123!");
  await page.getByLabel("Confirm new password").fill("Whatever123!");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page.getByRole("alert")).toContainText("invalid or has expired");
  await expect(page.getByRole("link", { name: "Get a new link" })).toBeVisible();
});

test("a new customer is asked to confirm their email and can resend the link", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First Name").fill("Akinyi");
  await page.getByLabel("Last Name").fill("Test");
  await page.getByLabel("Email Address").fill(`akinyi.${Date.now()}@example.com`);
  await page.getByLabel("Phone Number").fill("0712345678");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('input[type="password"]').nth(0).fill("Password123!");
  await page.locator('input[type="password"]').nth(1).fill("Password123!");
  await page.getByRole("button", { name: /Create Account/ }).click();
  await page.waitForURL("**/dashboard");

  const banner = page.getByRole("status").filter({ hasText: "confirm your email" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Resend link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "sent a new link" })).toBeVisible();
});
