<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('code')->nullable()->change();
            $table->string('pin_id')->nullable()->after('code');
            $table->string('provider')->nullable()->after('pin_id');
            $table->index('pin_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['pin_id']);
            $table->dropColumn(['pin_id', 'provider']);
            $table->string('code')->nullable(false)->change();
        });
    }
};
