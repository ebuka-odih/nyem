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
     * Updates listings table to match Listing model expectations:
     * 1. Rename 'images' to 'photos'
     * 2. Rename 'location' to 'city'
     * 3. Update 'type' enum to include all types: barter, marketplace, services, shop, swap
     * 4. Update 'status' enum to include 'swapped'
     */
    public function up(): void
    {
        $driverName = DB::getDriverName();
        
        Schema::table('listings', function (Blueprint $table) use ($driverName) {
            // Rename 'images' to 'photos' if column exists
            if (Schema::hasColumn('listings', 'images')) {
                if ($driverName === 'sqlite') {
                    DB::statement('ALTER TABLE listings RENAME COLUMN images TO photos');
                } else {
                    $table->renameColumn('images', 'photos');
                }
            } else if (!Schema::hasColumn('listings', 'photos')) {
                // Add photos column if neither exists
                $table->json('photos')->nullable()->after('description');
            }
            
            // Rename 'location' to 'city' if column exists
            if (Schema::hasColumn('listings', 'location')) {
                if ($driverName === 'sqlite') {
                    DB::statement('ALTER TABLE listings RENAME COLUMN location TO city');
                } else {
                    $table->renameColumn('location', 'city');
                }
            } else if (!Schema::hasColumn('listings', 'city')) {
                // Add city column if neither exists
                $table->string('city')->nullable()->after('price');
            }
            
            // Add 'looking_for' column if it doesn't exist
            if (!Schema::hasColumn('listings', 'looking_for')) {
                $table->string('looking_for')->nullable()->after('city');
            }
        });
        
        // Update type enum - SQLite doesn't support ALTER COLUMN for enums, so we need to recreate
        if ($driverName === 'sqlite') {
            // For SQLite, we'll just add a check constraint via a trigger or handle it in application
            // SQLite doesn't enforce enum types, so this is handled in the model
        } else {
            // For MySQL/PostgreSQL, modify the enum
            DB::statement("ALTER TABLE listings MODIFY COLUMN type ENUM('barter', 'marketplace', 'services', 'shop', 'swap') DEFAULT 'barter'");
            DB::statement("ALTER TABLE listings MODIFY COLUMN status ENUM('active', 'swapped', 'pending', 'paused') DEFAULT 'active'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driverName = DB::getDriverName();
        
        Schema::table('listings', function (Blueprint $table) use ($driverName) {
            // Rename back
            if (Schema::hasColumn('listings', 'photos')) {
                if ($driverName === 'sqlite') {
                    DB::statement('ALTER TABLE listings RENAME COLUMN photos TO images');
                } else {
                    $table->renameColumn('photos', 'images');
                }
            }
            
            if (Schema::hasColumn('listings', 'city')) {
                if ($driverName === 'sqlite') {
                    DB::statement('ALTER TABLE listings RENAME COLUMN city TO location');
                } else {
                    $table->renameColumn('city', 'location');
                }
            }
            
            // Remove looking_for if it was added
            if (Schema::hasColumn('listings', 'looking_for')) {
                $table->dropColumn('looking_for');
            }
        });
        
        // Revert enum changes
        if ($driverName !== 'sqlite') {
            DB::statement("ALTER TABLE listings MODIFY COLUMN type ENUM('shop', 'swap') DEFAULT 'shop'");
            DB::statement("ALTER TABLE listings MODIFY COLUMN status ENUM('active', 'pending', 'paused') DEFAULT 'active'");
        }
    }
};

