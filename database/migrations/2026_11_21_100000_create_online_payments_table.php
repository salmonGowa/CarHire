<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per attempt to collect money online (an M-PESA STK prompt or a card
 * checkout). A successful attempt creates the Payment; failed and abandoned
 * ones stay for support and reconciliation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 24)->unique();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 10); // mpesa | card
            $table->string('driver', 12); // simulate | daraja | paystack
            $table->unsignedInteger('amount');
            $table->string('phone', 16)->nullable();
            $table->string('email')->nullable();
            $table->string('status', 12)->default('pending'); // pending | succeeded | failed | cancelled | expired
            $table->string('checkout_id', 100)->nullable()->unique(); // Daraja CheckoutRequestID / Paystack access code
            $table->string('merchant_request_id', 100)->nullable();
            $table->string('receipt', 60)->nullable(); // M-PESA receipt / card transaction id
            $table->string('result_code', 20)->nullable();
            $table->string('result_desc')->nullable();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->json('payload')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_payments');
    }
};
