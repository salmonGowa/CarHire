<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Licences, certificates and policies each dealer must keep on file.
        Schema::create('dealer_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('status')->default('requested'); // requested, submitted, verified, rejected
            $table->date('due_on')->nullable();
            $table->date('expires_on')->nullable();
            $table->string('path')->nullable();
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->text('notes')->nullable(); // what was asked for
            $table->text('review_note')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['dealer_id', 'type']);
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->nullable()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dealer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->string('category');
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->string('status')->default('open'); // open, in_progress, resolved, closed
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'priority']);
        });

        Schema::create('support_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->boolean('internal')->default(false); // staff-only note
            $table->timestamps();
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->unsignedInteger('monthly_fee');
            $table->unsignedInteger('vehicle_limit')->nullable(); // null = unlimited
            $table->unsignedInteger('staff_limit')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('dealers', function (Blueprint $table) {
            $table->foreignId('subscription_plan_id')->nullable()->after('tier')->constrained()->nullOnDelete();
        });

        // One charge per dealer per billing month; paid manually (M-PESA / bank) and recorded here.
        Schema::create('subscription_charges', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->nullable()->unique();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('plan_name');
            $table->unsignedInteger('amount');
            $table->date('period_start');
            $table->date('period_end');
            $table->date('due_on');
            $table->string('status')->default('pending'); // pending, paid, void
            $table->string('method')->nullable();
            $table->string('transaction_ref')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['dealer_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_charges');
        Schema::table('dealers', fn (Blueprint $table) => $table->dropConstrainedForeignId('subscription_plan_id'));
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('support_messages');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('dealer_documents');
    }
};
