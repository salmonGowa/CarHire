# DriveFleet (CarHire)

Laravel 13 backend with a React 19 + TypeScript frontend. The UI lives in
`resources/js` and is bundled by Vite through `laravel-vite-plugin`; Laravel
serves it from a single Blade shell (`resources/views/app.blade.php`) and
react-router handles client-side routing.

## Requirements

- PHP 8.3+ and Composer
- Node 20+ and npm

## Setup

```sh
composer install
npm install
cp .env.example .env   # if .env does not exist yet
php artisan key:generate
```

Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` for the live-tracking map.

## Running

```sh
php artisan dev
```

This starts the Laravel server (http://127.0.0.1:8000), the Vite dev server
with hot reload, and the log tail together. Open the Laravel URL, not the Vite
one.

To serve a production build with Laravel alone:

```sh
npm run build
php artisan serve
```

## Scripts

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Vite dev server only                          |
| `npm run build` | Type-check (`tsc`) and build to `public/build` |
| `npm run types` | Type-check only                               |
| `npm run lint`  | ESLint over `resources/js`                    |
| `npm run test:e2e` | Browser tests of the main user flows (Playwright) |
| `npm run test:ui-audit` | Every page at desktop and phone width, light and dark: layout and error checks plus screenshots |

## Testing

- **Backend:** `php artisan test` runs the PHPUnit feature tests against the
  `drivefleet_test` database (see `phpunit.xml`). `vendor/bin/pint --test` checks
  code style.
- **Browser:** `npm run test:e2e` and `npm run test:ui-audit` drive Chromium
  against the app at `http://127.0.0.1:8000` (they start `php artisan serve` if
  nothing is running there; set `E2E_BASE_URL` to use another address). Run
  `npx playwright install chromium` once first. **They reseed the database in
  `.env` with `migrate:fresh --seed`**, so use a database you don't mind
  resetting. Failures leave screenshots and traces in `test-results/`; audit
  screenshots are there too.
- **CI:** `.github/workflows/ci.yml` runs all of the above on every push to
  `main` and on pull requests: PHP tests and Pint, lint/types/build, then both
  browser suites against a MySQL service. Reports are uploaded as artifacts.

## Layout

```
app/                      Laravel application code
routes/web.php            Catch-all route that renders the SPA shell
resources/views/app.blade.php
resources/css/app.css     Tailwind v4 entry
resources/js/
  app.tsx                 Entry point (mounted on #root)
  AppRoutes.tsx           react-router routes, role-based switchers
  components/             Shared UI + per-role feature components
  pages/                  Role dashboards and landing page
  lib/                    API client, useApi hook, formatting helpers
  types/models.ts         Shapes returned by the API
  data.ts                 Remaining mock data (screens not yet on the API)
  types/global.d.ts       Env and window typings
```

The `@/` import alias points at `resources/js`.

## Backend

Laravel session auth: the SPA and `/api/*` share the session cookie and CSRF
protection (`resources/js/lib/api.ts` sends the `XSRF-TOKEN`). A user's `role`
decides their dashboard; dealer staff belong to a dealership via `dealer_id`.

| Endpoint | Who | Notes |
| --- | --- | --- |
| `POST /api/auth/login`, `register`, `logout`; `GET /api/auth/user` | anyone | login throttled per email + IP |
| `GET/POST/PUT/DELETE /api/vehicles` | dealer (own fleet), super admin (all) | soft delete; blocked while bookings are open |
| `GET /api/catalog/vehicles` | signed in | bookable vehicles; `type`, `search`, `from`/`to` availability filter |
| `GET/PUT/DELETE /api/saved-vehicles` | customer | favourites |
| `GET/POST /api/bookings`, `GET /api/bookings/{id}` | scoped by role | server prices bookings (16% VAT) and rejects overlaps |
| `PATCH /api/bookings/{id}/status` | dealer/admin; customer may cancel | pending → confirmed → active → completed, or cancelled |
| `PUT /api/bookings/{id}/rating` | customer, completed trips | 1–5 |
| `GET /api/stats` | scoped by role | dashboard numbers |
| `GET /api/invoices`, `GET /api/invoices/{id}` | scoped by role | one tax invoice per booking, issued on confirmation |
| `POST /api/bookings/{id}/payments` | dealer/admin | record cash, M-PESA (code required), card or bank |
| `GET /api/payments`, `POST /api/payments/{id}/refund` | scoped; refunds by staff | refunds blocked once a payment is in a payout |
| `GET /api/finance/summary` | dealer/admin | monthly and 7-day totals, outstanding balances |
| `GET /api/payouts`; `POST /api/payouts/generate`, `/{id}/mark-paid` | dealer (own) / super admin | payout = platform-collected − fees; cash is the dealer's |

| `GET/POST/PUT/DELETE /api/maintenance`, `PATCH .../{id}/status` | dealer staff | starting a job puts the car in maintenance; finishing returns it |
| `GET/POST/PUT /api/drivers`, `GET /api/drivers/{id}` | dealer staff | chauffeurs; trips and rating come from bookings |
| `GET /api/agreements`; `PUT /api/bookings/{id}/agreement`, `POST .../agreement/sign` | dealer staff | self-drive or chauffeur (driver can't double-book) |
| `GET/POST/PUT/DELETE /api/promotions`, `GET /api/promotions/check` | dealer staff; check is open to customers | code is per dealer, applied before VAT |
| `GET /api/reviews`, `PUT /api/bookings/{id}/reply` | dealer staff | ratings + written reviews from completed trips |
| `GET /api/dealer-customers` | dealer staff | customers derived from the dealer's bookings |
| `/api/admin/dealers` (+ `/{id}/staff`), `/api/admin/clients` (+ `/{id}/kyc`, `/{id}/flag`), `/api/admin/staff` | super admins | creating a login returns a one-time temporary password |
| `PATCH /api/admin/users/{id}/status` | super admins | suspend/reinstate any account; suspended users are signed out |
| `GET /api/admin/audit-logs` (+ `/export` CSV) | super admins | sign-ins, account, booking, payment and payout events |
| `/api/admin/compliance` (+ `/{id}/file`, `/{id}/review`) | super admins | request, upload, approve/reject dealer documents; files on the private disk |
| `/api/dealer-documents` (+ `/{id}/file`) | dealer staff | the dealer's own requested documents and uploads |
| `/api/support-tickets` (+ `/{id}/messages`) | everyone signed in | admins see all tickets and can add internal notes; dealers see their dealership's; others see their own |
| `/api/admin/subscriptions`, `/api/admin/subscription-plans/{id}`, `/api/admin/dealers/{id}/plan`, `/api/admin/subscription-charges/*` | super admins | plan prices and limits, monthly charges, recording payments |
| `GET /api/subscription` | dealer staff | the dealer's plan, usage and charges |
| `/api/profile` (+ `/preferences`, `/password`, `/sign-out-others`, `/documents`), `DELETE /api/profile` | the signed-in user | own details, ID uploads for KYC (private disk), closing a customer account |
| `GET /api/search?q=` | everyone signed in | top-bar search, limited to what the user's role can see |
| `/api/dealer-staff` (+ `/{id}`, `/{id}/reset-password`) | dealer staff (changes: dealer managers) | the dealership's own logins; plan staff limit applies |
| `GET /api/notifications` (+ `/{id}/read`, `/read-all`) | everyone signed in | in-app notifications (database channel) for bookings, payments, support replies, KYC and compliance |
| `GET /api/rewards`, `GET /api/trips/current` | customers | tier and points from paid trips and reviews; the active or next booking |
| `GET /api/support-attachments/{id}` | ticket participants | photos/PDFs attached to support messages |
| `GET/PUT /api/admin/settings` | super admins | runtime platform settings (see below); every change is audited |
| `GET /api/admin/overview`, `/api/admin/reports?period=7d\|30d\|6m\|ytd\|all`, `/api/admin/integrations` | super admins | dashboard, analytics and live system checks |
| `/api/hr/*` (employees, attendance, leave, payroll-runs, payslips, documents, reports, summary) | HR managers and super admins | DriveFleet's own staff; documents on the private disk |

Payroll uses Kenyan statutory rates from `config/payroll.php` (PAYE bands,
NSSF, SHIF, Housing Levy, as in force during 2025). Rates change: have an
accountant confirm them before running a real payroll.

Money rules: booking totals include 16% VAT; the platform fee
(`PLATFORM_COMMISSION_RATE`, default 10%) is charged on the pre-VAT amount and
stored on each payment. Online collection (M-PESA STK push, card gateway) and
KRA eTIMS submission are not connected yet.

Dealer subscriptions are billed on the 1st by `php artisan drivefleet:bill-subscriptions`
(scheduled monthly; `php artisan dev` runs the scheduler for you, and production
needs a cron entry for `schedule:run`). Charges fall due after `SUBSCRIPTION_DUE_DAYS`
(default 7); dealers pay outside the app and an admin records the payment.
Plan vehicle and staff limits are enforced when vehicles or staff logins are added.

System Settings (stored in the `settings` table, defaults in `App\Support\Settings`)
take effect immediately: platform commission (new payments only), subscription
payment terms, customer booking rules (minimum/maximum length, cancellation
cut-off, minimum driver age when a date of birth is on file; dealer staff are
exempt), customer/dealer sign-up, maintenance mode (everyone but super admins is
locked out of the API and sign-in), sign-in attempts per minute, idle sign-out
time and support contacts. VAT stays in `config/drivefleet.php`. The app time
zone defaults to `Africa/Nairobi` (`APP_TIMEZONE`).

Notifications are in-app only: email and SMS aren't connected, though customers'
channel preferences are saved for when they are. Loyalty points are 1 per
KSh 100 paid on a completed trip plus 50 per review; redemption isn't built.
Live Trip shows the booking, dealer and payment details; there is no GPS
provider, so it says live location is unavailable.

Seed demo data with `php artisan migrate --seed` (all demo passwords are
`password`). Run the backend tests with `php artisan test`; they use the
`drivefleet_test` database configured in `phpunit.xml`.
