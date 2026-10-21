<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AgreementController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DealerCustomerController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\Hr;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SavedVehicleController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// Everything under /api lives in the web group so it shares the session
// cookie and CSRF protection with the SPA shell.

Route::prefix('api/auth')->group(function () {
    Route::get('user', [AuthController::class, 'show']);
    Route::post('login', [AuthController::class, 'login'])->middleware(['guest', 'throttle:login']);
    Route::post('register', [AuthController::class, 'register'])->middleware(['guest', 'throttle:register']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth');
});

Route::prefix('api')->middleware('auth')->group(function () {
    Route::get('stats', StatsController::class);

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

    // Money: invoices are issued per confirmed booking; staff record payments against them.
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('bookings/{booking}/payments', [PaymentController::class, 'store']);
    Route::post('payments/{payment}/refund', [PaymentController::class, 'refund']);
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
    });

    Route::middleware('role:superadmin')->group(function () {
        Route::post('payouts/generate', [PayoutController::class, 'generate']);
        Route::post('payouts/{payout}/mark-paid', [PayoutController::class, 'markPaid']);
    });
});

// The React app (resources/js) handles its own routing with react-router,
// so every non-API, non-asset path renders the same SPA shell.
Route::view('/{any?}', 'app')->where('any', '^(?!api|build|up).*$');
