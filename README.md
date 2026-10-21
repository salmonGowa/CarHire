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
(scheduled monthly, so run `php artisan schedule:work` or a cron entry for
`schedule:run` in production). Charges fall due after `SUBSCRIPTION_DUE_DAYS`
(default 7); dealers pay outside the app and an admin records the payment.
Plan vehicle and staff limits are enforced when vehicles or staff logins are added.

System Settings (stored in the `settings` table, defaults in `App\Support\Settings`)
take effect immediately: platform commission (new payments only), subscription
payment terms, customer booking rules (minimum/maximum length, cancellation
cut-off, minimum driver age when a date of birth is on file; dealer staff are
exempt), customer/dealer sign-up, maintenance mode (everyone but super admins is
locked out of the API and sign-in), sign-in attempts per minute, idle sign-out
time and support contacts. VAT stays in `config/drivefleet.php`. The app time
zone is UTC; set it to `Africa/Nairobi` in `config/app.php` before going live.

Seed demo data with `php artisan migrate --seed` (all demo passwords are
`password`). Run the backend tests with `php artisan test`; they use the
`drivefleet_test` database configured in `phpunit.xml`.
