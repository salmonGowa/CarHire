import { execSync } from "node:child_process";
import path from "node:path";
import { expect, type Browser, type Page } from "@playwright/test";

export const ACCOUNTS = {
  superadmin: "superadmin@drivefleet.test",
  hr: "hr@drivefleet.test",
  dealer: "dealer@drivefleet.test",
  customer: "customer@drivefleet.test",
} as const;

export const fixture = (name: string) => path.join(import.meta.dirname, "fixtures", name);

/** Fresh demo data: every spec starts from the same seeded state. */
export function reseed() {
  execSync("php artisan migrate:fresh --seed --force --quiet", { stdio: "inherit" });
}

export async function login(page: Page, email: string, password = "password") {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").first().fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
}

/**
 * A signed-in page in its own browser context. Sign in once per spec and reuse
 * it: the app rate-limits sign-ins (5 a minute per account), and confirm()
 * prompts (suspend, reset password…) are accepted the way a user would.
 */
export async function session(browser: Browser, email: string, password = "password") {
  const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
  page.on("dialog", (d) => d.accept());
  await login(page, email, password);
  return page;
}

/** Wait for in-flight requests (and a short animation beat) after an action. */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

/** Fail the test on uncaught page errors. Call at the start of a test. */
export function failOnPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return () => expect(errors, "uncaught page errors").toEqual([]);
}
