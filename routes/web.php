<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AgreementController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CustomerAccountController;
use App\Http\Controllers\Api\DealerCustomerController;
use App\Http\Controllers\Api\DealerDocumentController;
use App\Http\Controllers\Api\DealerStaffController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\Hr;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OnlinePaymentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RentalController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SavedVehicleController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Payments\CardCheckoutController;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Route;

// Everything under /api lives in the web group so it shares the session
// cookie and CSRF protection with the SPA shell.

// Public: the plans shown on the landing page's pricing section.
Route::get('api/public/plans', fn () => ['data' => SubscriptionPlan::orderBy('sort_order')->get(['name', 'monthly_fee', 'vehicle_limit', 'staff_limit', 'description'])]);

Route::prefix('api/auth')->group(function () {
    Route::get('user', [AuthController::class, 'show']);
    Route::post('login', [AuthController::class, 'login'])->middleware(['guest', 'throttle:login']);
    Route::post('register', [AuthController::class, 'register'])->middleware(['guest', 'throttle:register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');
    Route::post('email/verification-notification', [AuthController::class, 'resendVerification'])->middleware(['auth', 'throttle:6,1']);
});

// The link in the "confirm your email" message (signed, so no sign-in needed).
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

Route::prefix('api')->middleware('auth')->group(function () {
    Route::get('stats', StatsController::class);
    Route::get('search', SearchController::class);

    // Fleet management (dealer staff and super admins; scoped by VehiclePolicy).
    Route::apiResource('vehicles', VehicleController::class);

    // Customer-facing catalogue and favourites.
    Route::get('catalog/vehicles', CatalogController::class.'@index');
    Route::middleware('role:customer')->group(function () {
        Route::get('saved-vehicles', [SavedVehicleController::class, 'index']);
        Route::put('saved-vehicles/{vehicle}', [SavedVehicleController::class, 'store']);
        Route::delete('saved-vehicles/{vehicle}', [SavedVehicleController::class, 'destroy']);
        Route::delete('saved-vehicles', [SavedVehicleController::class, 'clear']);
    });

    Route::get('bookings', [BookingController::class, 'index']);
    Route::post('bookings', [BookingController::class, 'store']);
    Route::get('bookings/{booking}', [BookingController::class, 'show']);
    Route::patch('bookings/{booking}/status', [BookingController::class, 'updateStatus']);
    Route::put('bookings/{booking}/rating', [BookingController::class, 'rate']);

    // Handover, return, deposits and extensions.
    Route::post('bookings/{booking}/handover', [RentalController::class, 'handover']);
    Route::get('bookings/{booking}/return-quote', [RentalController::class, 'returnQuote']);
    Route::post('bookings/{booking}/return', [RentalController::class, 'receiveReturn']);
    Route::post('bookings/{booking}/deposit/settle', [RentalController::class, 'settleDeposit']);
    Route::post('bookings/{booking}/extensions', [RentalController::class, 'requestExtension']);
    Route::post('booking-extensions/{extension}/decide', [RentalController::class, 'decideExtension']);
    Route::get('inspections/{inspection}/photos/{index}', [RentalController::class, 'photo'])->whereNumber('index');

    // Money: invoices are issued per confirmed booking; staff record payments against them.
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('bookings/{booking}/payments', [PaymentController::class, 'store']);
    Route::post('payments/{payment}/refund', [PaymentController::class, 'refund']);

    // Paying online: M-PESA prompts and card checkouts (see OnlinePayments).
    Route::get('bookings/{booking}/online-payments', [OnlinePaymentController::class, 'index']);
    Route::post('bookings/{booking}/pay/mpesa', [OnlinePaymentController::class, 'mpesa'])->middleware('throttle:6,1');
    Route::post('bookings/{booking}/pay/card', [OnlinePaymentController::class, 'card'])->middleware('throttle:6,1');
    Route::get('online-payments/{onlinePayment}', [OnlinePaymentController::class, 'show']);
    Route::get('finance/summary', FinanceController::class);
    Route::get('payouts', [PayoutController::class, 'index']);

    // Dealer operations (scoped to the dealership in each controller).
    Route::get('maintenance', [MaintenanceController::class, 'index']);
    Route::post('maintenance', [MaintenanceController::class, 'store']);
    Route::put('maintenance/{task}', [MaintenanceController::class, 'update']);
    Route::patch('maintenance/{task}/status', [MaintenanceController::class, 'transition']);
    Route::delete('maintenance/{task}', [MaintenanceController::class, 'destroy']);
    Route::get('drivers', [DriverController::class, 'index']);
    Route::post('drivers', [DriverController::class, 'store']);
    Route::get('drivers/{driver}', [DriverController::class, 'show']);
    Route::put('drivers/{driver}', [DriverController::class, 'update']);
    Route::get('dealer-customers', [DealerCustomerController::class, 'index']);
    Route::get('reviews', [ReviewController::class, 'index']);
    Route::put('bookings/{booking}/reply', [ReviewController::class, 'reply']);
    Route::get('promotions', [PromotionController::class, 'index']);
    Route::post('promotions', [PromotionController::class, 'store']);
    Route::get('promotions/check', [PromotionController::class, 'check']);
    Route::put('promotions/{promotion}', [PromotionController::class, 'update']);
    Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy']);
    Route::get('agreements', [AgreementController::class, 'index']);
    Route::put('bookings/{booking}/agreement', [AgreementController::class, 'update']);
    Route::post('bookings/{booking}/agreement/sign', [AgreementController::class, 'sign']);

    // The signed-in user's own account.
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/preferences', [ProfileController::class, 'preferences']);
    Route::put('profile/password', [ProfileController::class, 'password']);
    Route::post('profile/sign-out-others', [ProfileController::class, 'signOutOthers']);
    Route::delete('profile', [ProfileController::class, 'destroy']);
    Route::post('profile/documents', [ProfileController::class, 'uploadDocument']);
    Route::delete('profile/documents/{document}', [ProfileController::class, 'deleteDocument']);
    Route::get('documents/{document}/file', [ProfileController::class, 'downloadDocument']);
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'read']);
    Route::middleware('role:customer')->group(function () {
        Route::get('rewards', [CustomerAccountController::class, 'rewards']);
        Route::get('trips/current', [CustomerAccountController::class, 'currentTrip']);
    });

    // Support tickets: everyone signed in; visibility is scoped in the controller.
    Route::get('support-tickets', [SupportTicketController::class, 'index']);
    Route::post('support-tickets', [SupportTicketController::class, 'store']);
    Route::get('support-tickets/{ticket}', [SupportTicketController::class, 'show']);
    Route::post('support-tickets/{ticket}/messages', [SupportTicketController::class, 'reply']);
    Route::patch('support-tickets/{ticket}', [SupportTicketController::class, 'update']);
    Route::get('support-attachments/{attachment}', [SupportTicketController::class, 'attachment']);

    // The dealer's own account: plan, charges and compliance documents.
    Route::middleware('role:dealer')->group(function () {
        Route::get('subscription', [Admin\SubscriptionController::class, 'mine']);
        Route::get('dealer-policy', [RentalController::class, 'policy']);
        Route::put('dealer-policy', [RentalController::class, 'updatePolicy']);
        Route::get('dealer-staff', [DealerStaffController::class, 'index']);
        Route::post('dealer-staff', [DealerStaffController::class, 'store']);
        Route::patch('dealer-staff/{staff}', [DealerStaffController::class, 'update']);
        Route::post('dealer-staff/{staff}/reset-password', [DealerStaffController::class, 'resetPassword']);
        Route::get('dealer-documents', [DealerDocumentController::class, 'index']);
        Route::post('dealer-documents', [DealerDocumentController::class, 'store']);
        Route::post('dealer-documents/{document}/file', [DealerDocumentController::class, 'upload']);
        Route::get('dealer-documents/{document}/file', [DealerDocumentController::class, 'download']);
    });

    // HR: DriveFleet's own employees. HR managers and super admins only.
    Route::prefix('hr')->middleware('role:hr,superadmin')->group(function () {
        Route::get('summary', Hr\HrSummaryController::class);
        Route::get('employees', [Hr\EmployeeController::class, 'index']);
        Route::post('employees', [Hr\EmployeeController::class, 'store']);
        Route::put('employees/{employee}', [Hr\EmployeeController::class, 'update']);
        Route::post('employees/{employee}/terminate', [Hr\EmployeeController::class, 'terminate']);
        Route::get('attendance', [Hr\AttendanceController::class, 'index']);
        Route::post('attendance/clock', [Hr\AttendanceController::class, 'clock']);
        Route::get('leave', [Hr\LeaveController::class, 'index']);
        Route::post('leave', [Hr\LeaveController::class, 'store']);
        Route::patch('leave/{leave}', [Hr\LeaveController::class, 'decide']);
        Route::get('payroll-runs', [Hr\PayrollController::class, 'index']);
        Route::post('payroll-runs', [Hr\PayrollController::class, 'store']);
        Route::get('payroll-runs/{run}', [Hr\PayrollController::class, 'show']);
        Route::post('payroll-runs/{run}/recalculate', [Hr\PayrollController::class, 'recalculate']);
        Route::post('payroll-runs/{run}/approve', [Hr\PayrollController::class, 'approve']);
        Route::post('payroll-runs/{run}/mark-paid', [Hr\PayrollController::class, 'markPaid']);
        Route::delete('payroll-runs/{run}', [Hr\PayrollController::class, 'destroy']);
        Route::get('payslips/{payslip}', [Hr\PayrollController::class, 'payslip']);
        Route::get('documents', [Hr\DocumentController::class, 'index']);
        Route::post('documents', [Hr\DocumentController::class, 'store']);
        Route::get('documents/{document}/download', [Hr\DocumentController::class, 'download']);
        Route::patch('documents/{document}', [Hr\DocumentController::class, 'review']);
        Route::delete('documents/{document}', [Hr\DocumentController::class, 'destroy']);
        Route::get('reports/{report}', Hr\HrReportController::class);
    });

    // Platform administration.
    Route::prefix('admin')->middleware('role:superadmin')->group(function () {
        Route::get('dealers', [Admin\DealerAdminController::class, 'index']);
        Route::post('dealers', [Admin\DealerAdminController::class, 'store']);
        Route::get('dealers/{dealer}', [Admin\DealerAdminController::class, 'show']);
        Route::put('dealers/{dealer}', [Admin\DealerAdminController::class, 'update']);
        Route::delete('dealers/{dealer}', [Admin\DealerAdminController::class, 'destroy']);
        Route::post('dealers/{dealer}/staff', [Admin\DealerAdminController::class, 'addStaff']);
        Route::patch('dealers/{dealer}/staff/{user}', [Admin\DealerAdminController::class, 'updateStaff']);
        Route::get('clients', [Admin\ClientAdminController::class, 'index']);
        Route::post('clients', [Admin\ClientAdminController::class, 'store']);
        Route::get('clients/{client}', [Admin\ClientAdminController::class, 'show']);
        Route::put('clients/{client}', [Admin\ClientAdminController::class, 'update']);
        Route::post('clients/{client}/kyc', [Admin\ClientAdminController::class, 'kyc']);
        Route::post('clients/{client}/flag', [Admin\ClientAdminController::class, 'flag']);
        Route::delete('clients/{client}', [Admin\ClientAdminController::class, 'destroy']);
        Route::get('staff', [Admin\StaffAdminController::class, 'index']);
        Route::post('staff', [Admin\StaffAdminController::class, 'store']);
        Route::patch('users/{user}/status', Admin\AccountStatusController::class);
        Route::get('audit-logs', [Admin\AuditLogController::class, 'index']);
        Route::get('audit-logs/export', [Admin\AuditLogController::class, 'export']);
        Route::get('compliance', [Admin\ComplianceController::class, 'index']);
        Route::post('compliance', [Admin\ComplianceController::class, 'store']);
        Route::post('compliance/{document}/file', [Admin\ComplianceController::class, 'upload']);
        Route::get('compliance/{document}/file', [Admin\ComplianceController::class, 'download']);
        Route::post('compliance/{document}/review', [Admin\ComplianceController::class, 'review']);
        Route::delete('compliance/{document}', [Admin\ComplianceController::class, 'destroy']);
        Route::get('overview', Admin\OverviewController::class);
        Route::get('reports', Admin\ReportsController::class);
        Route::get('integrations', Admin\IntegrationsController::class);
        Route::get('settings', [Admin\SettingsController::class, 'show']);
        Route::put('settings', [Admin\SettingsController::class, 'update']);
        Route::get('subscriptions', [Admin\SubscriptionController::class, 'index']);
        Route::put('subscription-plans/{plan}', [Admin\SubscriptionController::class, 'updatePlan']);
        Route::put('dealers/{dealer}/plan', [Admin\SubscriptionController::class, 'assign']);
        Route::post('subscription-charges/issue', [Admin\SubscriptionController::class, 'issue']);
        Route::post('subscription-charges/{charge}/pay', [Admin\SubscriptionController::class, 'pay']);
        Route::post('subscription-charges/{charge}/void', [Admin\SubscriptionController::class, 'void']);
    });

    Route::middleware('role:superadmin')->group(function () {
        Route::post('payouts/generate', [PayoutController::class, 'generate']);
        Route::post('payouts/{payout}/mark-paid', [PayoutController::class, 'markPaid']);
    });
});

// Card checkout: where the provider sends the customer back (no sign-in needed,
// the session may have lapsed), and the stand-in checkout used in development.
Route::get('payments/card/return', [CardCheckoutController::class, 'back'])->name('payments.card.return');
Route::middleware('auth')->group(function () {
    Route::get('payments/card/simulate/{reference}', [CardCheckoutController::class, 'simulate'])->name('payments.card.simulate');
    Route::post('payments/card/simulate/{reference}', [CardCheckoutController::class, 'decide'])->name('payments.card.simulate.decide');
});

// The React app (resources/js) handles its own routing with react-router,
// so every non-API, non-asset path renders the same SPA shell.
Route::view('/{any?}', 'app')->where('any', '^(?!api|build|up|webhooks).*$');
