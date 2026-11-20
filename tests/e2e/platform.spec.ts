import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, fixture, reseed, session, settle } from "./support";

let admin: Page;
let dealer: Page;
test.beforeAll(async ({ browser }) => {
  reseed();
  admin = await session(browser, ACCOUNTS.superadmin);
  dealer = await session(browser, ACCOUNTS.dealer);
});

test("subscriptions: record a payment and block a downgrade that doesn't fit", async () => {
  await admin.goto("/superadmin-subscriptions");
  await expect(admin.locator("main")).toContainText("KSh 49,000");
  await admin.getByRole("button", { name: "Overdue", exact: true }).click();
  await settle(admin);
  await admin.locator("tbody tr", { hasText: "Luxe Drive" }).getByRole("button", { name: /Record payment/ }).first().click();
  const pay = admin.getByRole("dialog", { name: "Record subscription payment" });
  await pay.getByPlaceholder("e.g. M-PESA code").fill("SKD81QWE2");
  await pay.getByRole("button", { name: "Mark Paid" }).click();
  await expect(admin.getByRole("status")).toContainText(/as paid/);

  await admin.getByLabel("Plan for Swift Car Hire").selectOption({ label: "Starter · KSh 3,000" });
  await expect(admin.locator("main")).toContainText(/staff logins; the Starter plan allows 2/);
});

test("compliance: dealer uploads a renewal, admin approves it", async () => {
  await dealer.goto("/dealer-account");
  await dealer.getByRole("button", { name: "Compliance Documents" }).click();
  await dealer.getByRole("button", { name: "Upload renewal" }).first().click();
  const upload = dealer.getByRole("dialog", { name: "Upload document" });
  await upload.locator('input[type="file"]').setInputFiles(fixture("document.pdf"));
  await upload.getByRole("button", { name: "Upload" }).click();
  await expect(dealer.locator("main")).toContainText(/pending review/i);

  await admin.goto("/superadmin-compliance");
  const row = admin.locator("tbody tr", { hasText: "Swift Car Hire" }).filter({ has: admin.getByRole("button", { name: "Review" }) });
  await row.getByRole("button", { name: "Review" }).click();
  const review = admin.getByRole("dialog", { name: "Review Document" });
  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
  await review.locator('input[type="date"]').fill(nextYear.toISOString().slice(0, 10));
  await review.getByRole("button", { name: "Approve Document" }).click();
  await settle(admin);
  await admin.getByLabel("Filter by status").selectOption("superseded");
  await expect(admin.locator("tbody tr", { hasText: "Swift Car Hire" })).toHaveCount(1);
});

test("support: dealer raises a ticket, admin replies with an internal note, dealer only sees the reply", async () => {
  await dealer.goto("/dealer-support");
  await dealer.getByRole("button", { name: "New", exact: true }).click();
  const form = dealer.getByRole("dialog", { name: "New support ticket" });
  await form.getByLabel("Subject").fill("E2E: invoice copy");
  await form.getByLabel("Category").selectOption("Payment & Billing");
  await form.getByLabel("Describe the problem").fill("Please resend the August invoice.");
  await form.getByRole("button", { name: "Submit Ticket" }).click();
  await expect(dealer.locator("main")).toContainText("E2E: invoice copy");

  await admin.goto("/superadmin-support");
  await admin.getByLabel("Search tickets").fill("E2E: invoice");
  await settle(admin);
  await admin.locator("ul li button", { hasText: "E2E: invoice" }).click();
  await admin.getByLabel("Reply").fill("Internal: check the August run");
  await admin.getByLabel("Internal note").check();
  await admin.getByRole("button", { name: "Add note" }).click();
  await settle(admin);
  await admin.getByLabel("Internal note").uncheck();
  await admin.getByLabel("Reply").fill("Sent to your billing email.");
  await admin.getByRole("button", { name: "Send" }).click();
  await expect(admin.getByLabel("Status", { exact: true })).toHaveValue("in_progress");

  await dealer.reload();
  await dealer.locator("ul li button", { hasText: "E2E: invoice" }).click();
  await expect(dealer.locator("main")).toContainText("Sent to your billing email.");
  await expect(dealer.locator("main")).not.toContainText("Internal: check");
});
