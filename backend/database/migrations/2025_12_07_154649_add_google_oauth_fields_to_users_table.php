<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * 
     * Adds Google OAuth fields to users table:
     * - email: For storing Google account email
     * - google_id: For storing Google user ID
     * Makes phone nullable to support email-based authentication
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Make phone nullable to support email-based Google OAuth users
            $table->string('phone')->nullable()->change();
            
            // Add email field for Google OAuth
            $table->string('email')->nullable()->unique()->after('phone');
            
            // Add Google ID field
            $table->string('google_id')->nullable()->unique()->after('email');
            
            // Add index on google_id for faster lookups
            $table->index('google_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['google_id']);
            $table->dropColumn(['email', 'google_id']);
            // Note: We don't revert phone to non-nullable as it might break existing data
            // If needed, manually update existing records before reverting
        });
    }
};
