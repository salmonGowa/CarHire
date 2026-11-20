<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // When each reminder went out, so the scheduler sends it once.
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('pickup_reminded_at')->nullable();
            $table->timestamp('return_reminded_at')->nullable();
            $table->timestamp('overdue_notified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn(['pickup_reminded_at', 'return_reminded_at', 'overdue_notified_at']));
    }
};
