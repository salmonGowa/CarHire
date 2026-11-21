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
| `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/email/verification-notification` | guests / signed-in users | password reset by email; resend the confirm-your-email link |
| `GET /api/notifications` (+ `/{id}/read`, `/read-all`) | everyone signed in | in-app notifications (database channel) for bookings, payments, support replies, KYC and compliance |
| `GET /api/rewards`, `GET /api/trips/current` | customers | tier and points from paid trips and reviews; the active or next booking |
| `POST /api/bookings/{id}/handover`, `GET …/return-quote`, `POST …/return`, `POST …/deposit/settle` | dealer staff for the booking, super admins | handover and return inspections (photos on the private disk), return charges, deposit settlement |
| `POST /api/bookings/{id}/extensions`, `POST /api/booking-extensions/{id}/decide` | the booking's customer / dealer staff | ask for more time; approve or decline |
| `GET/PUT /api/dealer-policy` | dealer staff (changes: dealer managers) | deposit and return-charge rules |
| `POST /api/bookings/{id}/pay/mpesa`, `POST …/pay/card`, `GET /api/online-payments/{id}`, `GET /api/bookings/{id}/online-payments` | the booking's customer (M-PESA prompts also dealer staff) | pay online and follow the attempt |
| `GET/PUT /api/dealer-payout-details` | dealer staff (changes: dealer managers, with their password) | where payouts go; masked for other staff |
| `GET /api/admin/online-payments?status=attention\|pending\|succeeded\|unsuccessful` | super admins | every online payment attempt |
| `POST /webhooks/mpesa/{token}`, `POST /webhooks/paystack` | payment providers (no session) | M-PESA STK results; Paystack signed events |
| `GET /api/support-attachments/{id}` | ticket participants | photos/PDFs attached to support messages |
| `GET/PUT /api/admin/settings` | super admins | runtime platform settings (see below); every change is audited |
| `GET /api/admin/overview`, `/api/admin/reports?period=7d\|30d\|6m\|ytd\|all`, `/api/admin/integrations` | super admins | dashboard, analytics and live system checks |
| `/api/hr/*` (employees, attendance, leave, payroll-runs, payslips, documents, reports, summary) | HR managers and super admins | DriveFleet's own staff; documents on the private disk |

Payroll uses Kenyan statutory rates from `config/payroll.php` (PAYE bands,
NSSF, SHIF, Housing Levy, as in force during 2025). Rates change: have an
accountant confirm them before running a real payroll.

Money rules: booking totals include 16% VAT; the platform fee
(`PLATFORM_COMMISSION_RATE`, default 10%) is charged on the pre-VAT amount and
stored on each payment. KRA eTIMS submission is not connected yet.

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

### Handover, return, deposits and extensions

Each dealer sets a **rental policy** under Plan & Compliance → Rental Policy;
customers see it before booking. The defaults are:

| Rule | Default |
| --- | --- |
| Security deposit | KSh 10,000 (copied onto each booking when it is made) |
| Grace period on returns | 60 minutes |
| Late fee | 10% of the daily rate per started hour, at most one day's rate for each day late |
| Fuel shortfall | KSh 150 per % of the tank below the pickup level |
| Mileage | unlimited; when a daily allowance is set, KSh 20 per extra km |

**Hand over keys** records the odometer, fuel, notes, up to 8 photos and the
deposit received (method and M-PESA/bank reference). **Mark returned** does the
same at return and shows a live quote of the charges. Late, fuel, mileage and
any damage amount become invoice lines (plus VAT). The rental price on the
booking doesn't change. The deposit then pays what's owed, recorded as a "From
deposit" payment that the platform doesn't collect. Staff record how the rest
went back. They can instead hold the deposit (for example, while waiting for a
damage quote) and settle it later. A cancelled booking's deposit is returned in
full.

Customers can ask for more time from Live Trip. The dealer approves or declines.
Approving checks the car is still free, then moves the return time and adds the
extra days to the booking and invoice. Refunds of payments record the method,
reference and reason. Rentals 24 hours overdue are escalated to super admins.

### Online payments and payouts

Customers pay from Billing, My Rentals or Live Trip with **Pay now**:

- **M-PESA:** an STK prompt goes to their phone (Safaricom Daraja, "Lipa na
  M-PESA Online"). They enter their PIN and the page updates on its own. Dealer
  staff can send the prompt to the customer's phone from **Record payment**.
- **Card:** a hosted Paystack checkout; DriveFleet never sees card details. The
  customer returns to Billing, which shows how it went.

Money collected online goes to DriveFleet's shortcode or Paystack account and
reaches the dealer in the next payout, less the platform fee, like other
non-cash payments.

Each attempt is an `OnlinePayment`. It settles exactly once, from whichever
comes first: the provider's callback or webhook, the customer's browser checking
in, or `php artisan drivefleet:reconcile-payments`, which runs every minute and
expires prompts left unanswered for 5 minutes (card checkouts after 60).
Success records an ordinary payment with the M-PESA receipt or card transaction
id, so invoices, receipts, commission and payouts work unchanged. If staff
already typed that M-PESA code in by hand it isn't counted twice. If money
arrives after the balance was paid another way, it is still recorded and the
dealer is told the booking is overpaid. If it arrives for a booking that was
cancelled meanwhile, super admins are alerted and it appears under **Global
Revenue → Online payments → Needs attention**.

| Setting | Development default | To take real money |
| --- | --- | --- |
| `MPESA_DRIVER` | `simulate`: prompts are approved after 3 seconds; numbers ending `000` cancel, `111` fail for lack of funds | `daraja` plus `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENVIRONMENT` (`sandbox`/`production`) and a long random `MPESA_CALLBACK_TOKEN`. For a till, set `MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline` and `MPESA_TILL_NUMBER`. |
| `CARD_DRIVER` | `simulate`: a test checkout page with Pay and Decline | `paystack` plus `PAYSTACK_SECRET_KEY` (`sk_test_…` or `sk_live_…`). Set the dashboard webhook URL to `APP_URL/webhooks/paystack`. |

Daraja doesn't sign callbacks, so results are accepted only at
`APP_URL/webhooks/mpesa/{MPESA_CALLBACK_TOKEN}`. It must be reachable over HTTPS
(use a tunnel such as ngrok to try the sandbox locally). Paystack webhooks are
checked against their HMAC signature, then re-verified with Paystack's API. The
simulators keep their state in the cache, so use any store but `array`; the admin
Integrations page shows which mode each provider is in.

**Payout details:** dealer managers set a bank account or M-PESA
phone/paybill/till under Plan & Compliance → Payouts. Changing them needs the
manager's password, is audited, and is announced to every manager at the
dealership and to super admins. Other staff see the numbers masked. For 48
hours after a change, the Payouts screen warns admins to confirm with the dealer
before sending, and marking that payout paid needs a tick to say they did. Each
paid payout keeps a copy of where the money went.

### Email, SMS and reminders

Every notification appears in the app (the bell). It is also **emailed** and,
when time-sensitive, **texted**, according to its category and the customer's
preferences: booking emails, receipt emails and SMS reminders can each be turned
off; account, support and compliance emails always go. Texts go out for booking
confirmations and cancellations, pickup reminders (24 hours ahead), return
reminders (3 hours ahead), overdue returns (30 minutes past) and extension
decisions. Walk-in
customers without an account get the reminders by SMS to the number on the
booking. `php artisan drivefleet:send-reminders` runs every 15 minutes.

Email and SMS are queued (`QUEUE_CONNECTION=database`); `php artisan dev` runs a
worker, and production needs `php artisan queue:work` alongside the scheduler.

| Setting | Development default | To send for real |
| --- | --- | --- |
| `MAIL_MAILER` | `log` (written to `storage/logs`) | `smtp`, `postmark`, `resend`, `ses`… with their keys |
| `SMS_DRIVER` | `log` | `africastalking` plus `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY` and optional `AFRICASTALKING_SENDER_ID` (use username `sandbox` with a sandbox key to test) |

Password reset works by email (`/forgot-password`, links expire after 60
minutes, other devices are signed out). New sign-ups get a link to confirm their
email and see a reminder banner until they do; nothing is blocked meanwhile. The
admin Integrations page shows what is configured.

Loyalty points are 1 per
KSh 100 paid on a completed trip plus 50 per review; redemption isn't built.
Live Trip shows the booking, dealer and payment details; there is no GPS
provider, so it says live location is unavailable.

Seed demo data with `php artisan migrate --seed` (all demo passwords are
`password`; three demo dealers have made-up payout details). Run the backend tests with `php artisan test`; they use the
`drivefleet_test` database configured in `phpunit.xml`.
