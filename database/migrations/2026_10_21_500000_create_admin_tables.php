<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dealers', function (Blueprint $table) {
            $table->string('owner_name')->nullable()->after('tax_pin');
            $table->string('owner_phone')->nullable()->after('owner_name');
            $table->string('owner_email')->nullable()->after('owner_phone');
            $table->string('owner_national_id')->nullable()->after('owner_email');
            $table->string('manager_name')->nullable()->after('owner_national_id');
            $table->string('manager_phone')->nullable()->after('manager_name');
            $table->string('manager_email')->nullable()->after('manager_phone');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('job_title')->nullable()->after('company');
            $table->string('alt_phone')->nullable()->after('phone');
            $table->string('national_id')->nullable()->after('alt_phone');
            $table->string('kra_pin')->nullable()->after('national_id');
            $table->date('date_of_birth')->nullable()->after('kra_pin');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('address')->nullable()->after('gender');
            $table->string('county')->nullable()->after('address');
            $table->string('kyc_status')->default('pending')->after('county');
            $table->timestamp('kyc_reviewed_at')->nullable()->after('kyc_status');
            $table->foreignId('kyc_reviewed_by')->nullable()->after('kyc_reviewed_at')->constrained('users')->nullOnDelete();
            $table->string('kyc_note')->nullable()->after('kyc_reviewed_by');
            $table->timestamp('flagged_at')->nullable()->after('kyc_note');
            $table->text('admin_notes')->nullable()->after('flagged_at');
            $table->timestamp('disabled_at')->nullable()->after('admin_notes');
            $table->timestamp('last_login_at')->nullable()->after('disabled_at');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor'); // who, as text, so it survives user deletion
            $table->string('action')->index();
            $table->string('description');
            $table->string('severity')->default('info')->index();
            $table->nullableMorphs('subject');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kyc_reviewed_by');
            $table->dropColumn(['job_title', 'alt_phone', 'national_id', 'kra_pin', 'date_of_birth', 'gender', 'address', 'county', 'kyc_status', 'kyc_reviewed_at', 'kyc_note', 'flagged_at', 'admin_notes', 'disabled_at', 'last_login_at']);
        });
        Schema::table('dealers', function (Blueprint $table) {
            $table->dropColumn(['owner_name', 'owner_phone', 'owner_email', 'owner_national_id', 'manager_name', 'manager_phone', 'manager_email']);
        });
    }
};
