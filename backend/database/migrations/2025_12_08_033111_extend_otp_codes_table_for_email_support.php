<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Extends otp_codes table to support email OTPs:
     * - Makes phone nullable (can be phone or email OTP)
     * - Adds email column for email-based OTPs
     * - Adds index on email for faster lookups
     */
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            // Make phone nullable to support email OTPs
            $table->string('phone')->nullable()->change();
            
            // Add email column for email-based OTPs
            $table->string('email')->nullable()->after('phone');
            
            // Add index on email for faster lookups
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
            // Note: We don't revert phone to non-nullable as it might break existing data
            // If needed, manually update existing records before reverting
        });
    }
};
