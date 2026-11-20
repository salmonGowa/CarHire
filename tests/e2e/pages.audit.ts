import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, reseed } from "./support";

/**
 * Every page, at desktop and phone width, in light and dark mode: no sideways
 * scrolling, nothing past the right edge of the screen, no uncaught errors.
 * Screenshots land in test-results/ for a visual check.
 */
const ROUTES: Record<keyof typeof ACCOUNTS, string[]> = {
  superadmin: ["dashboard", "superadmin-dealers", "superadmin-subscriptions", "superadmin-fleet", "superadmin-rentals", "superadmin-clients", "superadmin-revenue", "superadmin-payouts", "superadmin-staff", "superadmin-support", "superadmin-compliance", "superadmin-integrations", "superadmin-audit-logs", "superadmin-reports", "superadmin-system"],
  dealer: ["dashboard", "dealer-fleet", "maintenance", "live-tracking", "admin-add-booking", "dealer-booking", "dealer-payments", "availability", "dealer-contracts", "dealer-customers", "dealer-drivers", "dealer-staff", "dealer-earnings", "dealer-invoices", "dealer-reviews", "dealer-promotions", "dealer-support", "dealer-account"],
  hr: ["dashboard", "hrstaff", "hrattendance", "hrpayroll", "hrdocs", "hrreports"],
  customer: ["dashboard", "customer-browse", "customer-rentals", "customer-active-trip", "customer-saved", "customer-billing", "customer-rewards", "customer-complaint", "customer-support", "customer-profile"],
};
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
// External services that may be unavailable in test environments.
const IGNORED_ERRORS = /googleapis|Google Maps|Failed to load resource|unsplash/i;

test.beforeAll(reseed);

async function layoutProblems(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > vw + 1) problems.push(`page scrolls sideways (${document.documentElement.scrollWidth}px wide)`);
    for (const el of document.querySelectorAll("main *, header *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 2) continue;
      let a = el.parentElement, clipped = false;
      while (a && a !== document.body) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) { clipped = true; break; }
        a = a.parentElement;
      }
      if (!clipped) problems.push(`<${el.tagName.toLowerCase()} class="${String((el as HTMLElement).className).slice(0, 60)}"> ends at ${Math.round(r.right)}px`);
      if (problems.length > 3) break;
    }
    return problems;
  });
}

for (const [view, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of ["light", "dark"] as const) {
    test(`public pages · ${view} · ${theme}`, async ({ browser }, info) => {
      const ctx = await browser.newContext({ viewport, isMobile: view === "phone", hasTouch: view === "phone" });
      await ctx.addInitScript((t) => localStorage.setItem("df-theme", t), theme);
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const path of ["/", "/login", "/register"]) {
        await page.goto(path, { waitUntil: "networkidle" });
        expect.soft(await layoutProblems(page), `${path} layout`).toEqual([]);
        await page.screenshot({ path: info.outputPath(`public${path.replace(/\//g, "-") || "-landing"}.png`) });
      }
      expect(errors).toEqual([]);
      await ctx.close();
    });

    for (const [role, routes] of Object.entries(ROUTES) as [keyof typeof ACCOUNTS, string[]][]) {
      test(`${role} pages · ${view} · ${theme}`, async ({ browser }, info) => {
        const ctx = await browser.newContext({ viewport, isMobile: view === "phone", hasTouch: view === "phone" });
        await ctx.addInitScript((t) => localStorage.setItem("df-theme", t), theme);
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => { if (m.type() === "error" && !IGNORED_ERRORS.test(m.text())) errors.push(m.text()); });
        await login(page, ACCOUNTS[role]);
        for (const route of routes) {
          errors.length = 0;
          await page.goto(`/${route}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(400);
          expect.soft(await layoutProblems(page), `/${route} layout`).toEqual([]);
          expect.soft(errors, `/${route} errors`).toEqual([]);
          await page.screenshot({ path: info.outputPath(`${route}.png`) });
        }
        await ctx.close();
      });
    }
  }
}
