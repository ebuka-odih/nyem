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
     * Adds 'star' type to listing_stats table enum to track super interest/wishlist actions
     */
    public function up(): void
    {
        $driverName = DB::getDriverName();
        
        // SQLite doesn't enforce enum types strictly, so we just need to ensure the column exists
        // For MySQL/PostgreSQL, we need to modify the enum
        if ($driverName === 'mysql') {
            DB::statement("ALTER TABLE listing_stats MODIFY COLUMN type ENUM('view', 'like', 'share', 'star') NOT NULL");
        } elseif ($driverName === 'pgsql') {
            // PostgreSQL uses CHECK constraints, so we need to drop and recreate
            DB::statement("ALTER TABLE listing_stats DROP CONSTRAINT IF EXISTS listing_stats_type_check");
            DB::statement("ALTER TABLE listing_stats ADD CONSTRAINT listing_stats_type_check CHECK (type IN ('view', 'like', 'share', 'star'))");
        }
        // SQLite doesn't enforce enum types, so no action needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driverName = DB::getDriverName();
        
        if ($driverName === 'mysql') {
            // Remove 'star' from enum (this will fail if there are existing 'star' records)
            DB::statement("ALTER TABLE listing_stats MODIFY COLUMN type ENUM('view', 'like', 'share') NOT NULL");
        } elseif ($driverName === 'pgsql') {
            DB::statement("ALTER TABLE listing_stats DROP CONSTRAINT IF EXISTS listing_stats_type_check");
            DB::statement("ALTER TABLE listing_stats ADD CONSTRAINT listing_stats_type_check CHECK (type IN ('view', 'like', 'share'))");
        }
        // SQLite doesn't enforce enum types, so no action needed
    }
};
