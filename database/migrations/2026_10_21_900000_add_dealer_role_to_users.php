<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Within a dealership: managers can add and suspend their colleagues' logins.
        Schema::table('users', function (Blueprint $table) {
            $table->string('dealer_role')->nullable()->after('dealer_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('dealer_role'));
    }
};
