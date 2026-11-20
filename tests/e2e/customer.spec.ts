import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, failOnPageErrors, fixture, reseed, session } from "./support";

let page: Page;
test.beforeAll(async ({ browser }) => {
  reseed();
  page = await session(browser, ACCOUNTS.customer);
});

const sections = () => page.locator("nav[aria-label='Profile sections']");

test("dashboard and Live Trip show the real current trip", async () => {
  const errors = failOnPageErrors(page);
  await page.goto("/dashboard");
  await expect(page.locator("main")).toContainText("Toyota Land Cruiser Prado");
  await expect(page.locator("main")).toContainText(/time left|overdue by/i);
  await page.goto("/customer-active-trip");
  await expect(page.locator("main")).toContainText(/Live location isn't available/);
  await expect(page.locator("main")).toContainText("Swift Car Hire");
  errors();
});

test("opening a notification marks it read and follows its link", async () => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Notifications \(1 unread\)/ }).click();
  await page.getByRole("button", { name: /Booking confirmed/ }).click();
  await page.waitForURL("**/customer-active-trip");
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
});

test("profile: save details, upload ID, change preferences", async () => {
  await page.goto("/customer-profile");
  await expect(page.locator("main")).toContainText(/ID verified/i);
  await page.getByLabel("Alternative Phone").fill("+254 733 000 111");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved");
  await expect(page.getByLabel("National ID / Passport No.")).toBeDisabled();

  await page.getByLabel("Email Address").fill("new.address@example.com");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.locator("main")).toContainText(/current password/i);
  await page.getByLabel("Email Address").fill(ACCOUNTS.customer);

  await page.locator('input[type="file"]').setInputFiles(fixture("damage.jpg"));
  await expect(page.getByRole("status")).toContainText("uploaded");

  await sections().getByRole("button", { name: "Payment Details" }).click();
  await page.getByLabel("Safaricom number").fill("12345");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("main")).toContainText("Kenyan mobile number");

  await sections().getByRole("button", { name: "Preferences" }).click();
  await page.getByRole("button", { name: "Sedan", exact: true }).click();
  await page.getByRole("button", { name: "Save Preferences" }).click();
  await expect(page.getByRole("status")).toContainText("Preferences saved");

  await sections().getByRole("button", { name: "Security" }).click();
  await page.getByLabel("Current password").fill("wrong");
  await page.locator('input[autocomplete="new-password"]').nth(0).fill("Newpass123!");
  await page.locator('input[autocomplete="new-password"]').nth(1).fill("Newpass123!");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page.locator("main")).toContainText("not correct");
});

test("file a complaint with a photo and get a reference", async () => {
  await page.goto("/customer-complaint");
  await page.getByLabel("What happened?").fill("Deep scratch on the rear bumper that was not noted at pickup.");
  await page.locator('input[type="file"]').setInputFiles(fixture("damage.jpg"));
  await page.getByRole("button", { name: "Submit Complaint" }).click();
  await expect(page.locator("main")).toContainText("Complaint received");
  await expect(page.locator("main")).toContainText(/TKT-\d+/);
});

test("report a problem opens an urgent roadside ticket", async () => {
  await page.goto("/customer-support?roadside=1");
  const form = page.getByRole("dialog", { name: "New support ticket" });
  await expect(form.getByLabel("Category")).toHaveValue("Roadside Assistance");
  await expect(form.getByLabel("Priority")).toHaveValue("urgent");
});

test("can't close the account while a trip is in progress", async () => {
  await page.goto("/customer-profile");
  await sections().getByRole("button", { name: "Security" }).click();
  await page.getByRole("button", { name: "Close my account" }).click();
  const dialog = page.getByRole("dialog", { name: "Close account" });
  await dialog.getByLabel("Type DELETE").fill("DELETE");
  await dialog.getByLabel("Your password").fill("password");
  await dialog.getByRole("button", { name: "Close account" }).click();
  await expect(dialog).toContainText("bookings in progress");
});
