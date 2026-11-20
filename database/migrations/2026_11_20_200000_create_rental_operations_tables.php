<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each dealer's rental policy (shown to customers before they book).
        Schema::table('dealers', function (Blueprint $table) {
            $table->unsignedInteger('deposit_amount')->default(10000);
            $table->unsignedSmallInteger('late_grace_minutes')->default(60);
            $table->unsignedTinyInteger('late_fee_percent')->default(10); // of the daily rate, per started hour
            $table->unsignedInteger('fuel_charge_per_percent')->default(150);
            $table->unsignedInteger('included_km_per_day')->nullable(); // null = unlimited
            $table->unsignedInteger('extra_km_rate')->default(20);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('deposit_amount')->default(0); // the dealer's deposit when booked
            $table->unsignedInteger('deposit_received')->default(0);
            $table->string('deposit_method')->nullable();
            $table->string('deposit_reference')->nullable();
            $table->timestamp('deposit_received_at')->nullable();
            $table->unsignedInteger('deposit_applied')->default(0);
            $table->unsignedInteger('deposit_refunded')->default(0);
            $table->string('deposit_refund_method')->nullable();
            $table->string('deposit_refund_reference')->nullable();
            $table->timestamp('deposit_settled_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('overdue_escalated_at')->nullable();
        });

        // Condition when the keys go out and when the car comes back.
        Schema::create('booking_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // pickup | return
            $table->unsignedInteger('odometer');
            $table->unsignedTinyInteger('fuel_level');
            $table->text('notes')->nullable();
            $table->json('photos')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['booking_id', 'type']);
        });

        // Extra charges added to the invoice at return (late, fuel, mileage, damage).
        Schema::create('booking_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('description');
            $table->unsignedInteger('amount'); // before VAT
            $table->unsignedInteger('vat');
            $table->unsignedInteger('total');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('booking_extensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('from_return_at');
            $table->dateTime('to_return_at');
            $table->unsignedSmallInteger('extra_days');
            $table->unsignedInteger('amount'); // VAT-inclusive
            $table->string('status')->default('pending'); // pending | approved | declined
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // How a refund actually went back to the customer.
        Schema::table('payments', function (Blueprint $table) {
            $table->string('refund_method')->nullable()->after('refunded_at');
            $table->string('refund_reference')->nullable()->after('refund_method');
            $table->string('refund_reason')->nullable()->after('refund_reference');
            $table->foreignId('refunded_by')->nullable()->after('refund_reason')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('refunded_by');
            $table->dropColumn(['refund_method', 'refund_reference', 'refund_reason']);
        });
        Schema::dropIfExists('booking_extensions');
        Schema::dropIfExists('booking_charges');
        Schema::dropIfExists('booking_inspections');
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn([
            'deposit_amount', 'deposit_received', 'deposit_method', 'deposit_reference', 'deposit_received_at', 'deposit_applied',
            'deposit_refunded', 'deposit_refund_method', 'deposit_refund_reference', 'deposit_settled_at', 'picked_up_at', 'returned_at', 'overdue_escalated_at',
        ]));
        Schema::table('dealers', fn (Blueprint $table) => $table->dropColumn([
            'deposit_amount', 'late_grace_minutes', 'late_fee_percent', 'fuel_charge_per_percent', 'included_km_per_day', 'extra_km_rate',
        ]));
    }
};
