<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained()->cascadeOnDelete();
            $table->string('model');
            $table->string('plate')->unique();
            $table->string('type')->index();
            $table->unsignedSmallInteger('year')->nullable();
            $table->unsignedTinyInteger('seats')->default(5);
            $table->string('transmission')->default('auto');
            $table->string('fuel_type')->default('petrol');
            $table->unsignedInteger('daily_rate');
            $table->unsignedInteger('mileage')->default(0);
            $table->unsignedTinyInteger('fuel_level')->default(100);
            $table->string('status')->default('available')->index();
            $table->string('location')->nullable();
            $table->string('image_url', 2048)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('saved_vehicles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'vehicle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_vehicles');
        Schema::dropIfExists('vehicles');
    }
};
