<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('service');
            $table->date('due_date');
            $table->string('priority')->default('medium');
            $table->string('status')->default('scheduled')->index();
            $table->unsignedInteger('cost')->nullable();
            $table->string('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('license_class');
            $table->string('license_number')->nullable();
            $table->date('license_expires_on')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('joined_on')->nullable();
            $table->string('photo_url', 2048)->nullable();
            $table->string('license_image_url', 2048)->nullable();
            $table->timestamps();
        });

        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('type'); // percentage | flat
            $table->unsignedInteger('value');
            $table->unsignedInteger('max_uses')->nullable();
            $table->date('expires_on');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['dealer_id', 'code']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->after('created_by')->constrained()->nullOnDelete();
            $table->foreignId('promotion_id')->nullable()->after('driver_id')->constrained()->nullOnDelete();
            $table->unsignedInteger('discount')->default(0)->after('daily_rate');
            $table->string('agreement_type')->default('self_drive')->after('payment_method');
            $table->timestamp('agreement_signed_at')->nullable()->after('agreement_type');
            $table->text('review')->nullable()->after('rating');
            $table->timestamp('rated_at')->nullable()->after('review');
            $table->text('review_reply')->nullable()->after('rated_at');
            $table->timestamp('replied_at')->nullable()->after('review_reply');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('driver_id');
            $table->dropConstrainedForeignId('promotion_id');
            $table->dropColumn(['discount', 'agreement_type', 'agreement_signed_at', 'review', 'rated_at', 'review_reply', 'replied_at']);
        });
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('maintenance_tasks');
    }
};
