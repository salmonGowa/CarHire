<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->dateTime('issued_at');
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('vat');
            $table->unsignedInteger('total');
            // Kept in step with completed payments so lists can sort and filter by balance.
            $table->unsignedInteger('amount_paid')->default(0);
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();

            $table->index(['dealer_id', 'issued_at']);
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedInteger('payment_count');
            // Money the platform collected for the dealer (M-PESA, card, bank).
            $table->unsignedInteger('gross_collected');
            // Cash the dealer took directly; listed for reconciliation, not paid out.
            $table->unsignedInteger('cash_collected');
            $table->unsignedInteger('commission');
            // gross_collected - commission. Negative when cash fees exceed what the platform holds.
            $table->integer('net');
            $table->string('status')->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->string('transfer_reference')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('amount');
            // VAT portion of the amount and the platform fee, fixed when recorded.
            $table->unsignedInteger('vat');
            $table->unsignedInteger('commission');
            $table->string('method');
            $table->string('transaction_code')->nullable()->unique();
            $table->string('status')->default('completed')->index();
            $table->dateTime('paid_at')->index();
            $table->timestamp('refunded_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('payout_id')->nullable()->constrained()->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('invoices');
    }
};
