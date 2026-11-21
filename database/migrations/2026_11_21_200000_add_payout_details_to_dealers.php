<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where DriveFleet sends each dealer's payouts (a bank account or M-PESA), and
 * a snapshot of where each payout actually went.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dealers', function (Blueprint $table) {
            $table->string('payout_method', 10)->nullable(); // bank | mpesa
            $table->string('payout_bank_name', 80)->nullable();
            $table->string('payout_bank_branch', 80)->nullable();
            $table->string('payout_account_name', 120)->nullable();
            $table->string('payout_account_number', 40)->nullable();
            $table->string('payout_mpesa_type', 10)->nullable(); // phone | paybill | till
            $table->string('payout_mpesa_number', 20)->nullable();
            $table->string('payout_mpesa_account', 40)->nullable(); // paybill account number
            $table->timestamp('payout_details_updated_at')->nullable();
            $table->foreignId('payout_details_updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
        Schema::table('payouts', function (Blueprint $table) {
            $table->string('paid_to')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payouts', fn (Blueprint $table) => $table->dropColumn('paid_to'));
        Schema::table('dealers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payout_details_updated_by');
            $table->dropColumn(['payout_method', 'payout_bank_name', 'payout_bank_branch', 'payout_account_name', 'payout_account_number',
                'payout_mpesa_type', 'payout_mpesa_number', 'payout_mpesa_account', 'payout_details_updated_at']);
        });
    }
};
