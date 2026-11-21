<?php

use App\Http\Controllers\Payments\WebhookController;
use Illuminate\Support\Facades\Route;

// Payment providers post results here. These routes use the stateless "api"
// middleware group: no session, no CSRF token. Each provider is checked in
// WebhookController instead (a secret URL token for M-PESA, a signature for Paystack).

Route::post('webhooks/mpesa/{token}', [WebhookController::class, 'mpesa'])->middleware('throttle:120,1');
Route::post('webhooks/paystack', [WebhookController::class, 'paystack'])->middleware('throttle:120,1');
