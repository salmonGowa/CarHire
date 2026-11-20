import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against the real app with the demo seed data.
 *
 *   npm run test:e2e        – user flows (tests/e2e/*.spec.ts)
 *   npm run test:ui-audit   – every page × desktop/phone × light/dark (tests/e2e/*.audit.ts)
 *
 * Both reseed the database configured in .env (php artisan migrate:fresh --seed),
 * so don't point them at data you want to keep.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  testDir: "tests/e2e",
  // Specs share one database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: "e2e", testMatch: /.*\.spec\.ts/ },
    { name: "ui-audit", testMatch: /.*\.audit\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "php artisan serve --port=8000", url: `${baseURL}/up`, reuseExistingServer: true, timeout: 60_000 },
});
