import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, failOnPageErrors, reseed, session, settle } from "./support";

let page: Page;
test.beforeAll(async ({ browser }) => {
  reseed();
  page = await session(browser, ACCOUNTS.superadmin);
});

const tempPassword = async (p: Page) => (await p.getByRole("status").locator("code").innerText()).trim();

test("onboard a dealer and give them a manager login", async () => {
  const errors = failOnPageErrors(page);
  await page.goto("/superadmin-dealers");
  await expect(page.locator("main")).toContainText("Swift Car Hire");
  await page.getByRole("button", { name: /Onboard Dealer/ }).click();
  const form = page.getByRole("dialog", { name: "Onboard New Dealer" });
  await form.getByLabel("Dealership Name").fill("E2E Motors");
  await form.getByLabel("City / Town").fill("Thika");
  await form.getByRole("button", { name: "Onboard Dealer" }).click();
  await expect(page.getByRole("button", { name: "Back to dealers" })).toBeVisible();

  await page.getByRole("button", { name: /^staff$/i }).click();
  await page.getByRole("button", { name: "Add Staff" }).click();
  const staff = page.getByRole("dialog");
  await staff.getByLabel("Full Name").fill("E2E Manager");
  await staff.getByLabel("Email (used to sign in)").fill("e2e.manager@e2emotors.test");
  await staff.getByLabel("Role / Position").fill("Branch manager");
  await expect(staff.getByLabel("Access")).toHaveValue("manager"); // first login defaults to manager
  await staff.getByRole("button", { name: "Create Login" }).click();
  expect((await tempPassword(page)).length).toBeGreaterThanOrEqual(10);
  await expect(page.locator("main")).toContainText("Manager");
  errors();
});

test("review a client's KYC with their uploaded documents", async () => {
  await page.goto("/superadmin-clients");
  await page.getByLabel("Filter by KYC").selectOption("Pending");
  await settle(page);
  await page.getByRole("button", { name: /Michael/ }).first().click();
  await page.getByRole("button", { name: "KYC Review" }).first().click();
  const review = page.getByRole("dialog", { name: "KYC Review" });
  await expect(review).toContainText("National ID (front)");
  await review.getByRole("button", { name: "Reject" }).click();
  await review.getByRole("button", { name: "Submit Decision" }).click();
  await expect(review).toContainText(/reason|note/i);
  await review.getByRole("button", { name: "Approve" }).click();
  await review.getByRole("button", { name: "Submit Decision" }).click();
  await expect(page.locator("main")).toContainText(/KYC Verified/i);
});

test("invite and suspend internal staff; the audit log records it and exports", async () => {
  await page.goto("/superadmin-staff");
  await page.getByRole("button", { name: /Add Staff Member/ }).click();
  const invite = page.getByRole("dialog", { name: "Add staff member" });
  await invite.getByLabel("Full Name").fill("E2E HR");
  await invite.getByLabel("Work Email").fill("e2e.hr@drivefleet.ke");
  await invite.getByLabel("Job Title").fill("HR Officer");
  await invite.getByRole("button", { name: "Create Account" }).click();
  await settle(page);
  await page.locator("tbody tr", { hasText: "E2E HR" }).getByRole("button", { name: "Suspend" }).click();
  await settle(page);
  await expect(page.locator("tbody tr", { hasText: "E2E HR" })).toContainText(/suspended/i);

  await page.goto("/superadmin-audit-logs");
  await page.getByLabel("Search logs").fill("e2e.hr");
  await settle(page);
  await expect(page.locator("main")).toContainText("Suspended e2e.hr");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Export CSV/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/audit-log-.*\.csv/);
});
