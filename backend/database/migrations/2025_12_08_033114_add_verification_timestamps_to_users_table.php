<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds verification timestamps to users table:
     * - email_verified_at: When email was verified via OTP
     * - phone_verified_at: When phone was verified via OTP
     * Also migrates existing otp_verified_at data to appropriate fields
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add email verification timestamp
            $table->timestamp('email_verified_at')->nullable()->after('otp_verified_at');
            
            // Add phone verification timestamp
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
        });

        // Migrate existing data: set verification timestamps based on existing otp_verified_at
        // If user has phone, set phone_verified_at
        // If user has email, set email_verified_at
        DB::statement("
            UPDATE users 
            SET phone_verified_at = otp_verified_at 
            WHERE phone IS NOT NULL AND otp_verified_at IS NOT NULL
        ");
        
        DB::statement("
            UPDATE users 
            SET email_verified_at = otp_verified_at 
            WHERE email IS NOT NULL AND otp_verified_at IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_verified_at', 'phone_verified_at']);
        });
    }
};
