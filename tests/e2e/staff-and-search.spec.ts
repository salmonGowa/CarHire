import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, login, reseed, session, settle } from "./support";

test.beforeAll(reseed);

const search = async (page: Page, q: string) => {
  await page.getByRole("combobox", { name: "Search" }).fill(q);
  const results = page.locator("#global-search-results");
  await expect(results).toBeVisible();
  await settle(page);
  return results;
};

test("admin search deep-links to a client and Back closes it", async ({ page }) => {
  await login(page, ACCOUNTS.superadmin);
  await expect(await search(page, "Michael")).toContainText("Michael");
  await page.getByRole("combobox", { name: "Search" }).press("Enter");
  await expect(page).toHaveURL(/superadmin-clients\?open=\d+/);
  await expect(page.getByRole("button", { name: "Back to clients" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Back to clients" })).toHaveCount(0);

  await expect(await search(page, "zzzqqq")).toContainText("Nothing matches");
});

test("dealer search only covers their own dealership", async ({ page }) => {
  await login(page, ACCOUNTS.dealer);
  const results = await search(page, "Auto");
  await expect(results).not.toContainText("Premier Auto Group");
});

test("dealer manager manages staff logins; staff see the team read-only", async ({ browser }) => {
  const page = await session(browser, ACCOUNTS.dealer);
  await page.goto("/dealer-staff");
  await expect(page.locator("main")).toContainText("Faith Njeri");
  await page.getByRole("button", { name: "Add staff login" }).click();
  const form = page.getByRole("dialog", { name: "Add staff login" });
  await form.getByLabel("Full name").fill("E2E Desk");
  await form.getByLabel("Email (used to sign in)").fill("e2e.desk@swiftcarhire.co.ke");
  await form.getByLabel("Role / position").fill("Desk agent");
  await form.getByRole("button", { name: "Create login" }).click();
  await expect(page.getByRole("status")).toContainText("e2e.desk");
  await page.getByRole("button", { name: "Done" }).click();

  const faith = page.locator("li", { hasText: "Faith Njeri" });
  await faith.getByRole("button", { name: "Reset password" }).click();
  const password = (await page.getByRole("status").locator("code").innerText()).trim();
  expect(password).toHaveLength(12);

  const colleague = await session(browser, "faith.njeri@swiftcarhire.co.ke", password);
  await colleague.goto("/dealer-staff");
  await expect(colleague.locator("main")).toContainText("Ask a manager");
  await expect(colleague.getByRole("button", { name: "Add staff login" })).toHaveCount(0);
});
