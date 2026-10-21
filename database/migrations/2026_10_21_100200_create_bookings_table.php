<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained();
            // Null for walk-in clients booked by a dealer without an account.
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('customer_id_number')->nullable();
            $table->dateTime('pickup_at');
            $table->dateTime('return_at');
            $table->string('pickup_location');
            $table->unsignedSmallInteger('days');
            $table->unsignedInteger('daily_rate');
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('vat');
            $table->unsignedInteger('total');
            $table->string('payment_method')->nullable();
            $table->string('status')->default('pending')->index();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'pickup_at', 'return_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
