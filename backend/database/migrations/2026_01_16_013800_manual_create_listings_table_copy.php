<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driverName = DB::getDriverName();

        // 1. Force Disable Foreign Key checks so we can do whatever we want
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }

        // 2. Drop the redundant 'listings' table if it exists
        // (Just in case a failed migration left it half-created)
        Schema::dropIfExists('listings');

        // 3. COPY STRUCTURE: Create the 'listings' table EXACTLY like the 'items' table
        if ($driverName === 'mysql') {
            DB::statement('CREATE TABLE listings LIKE items');
        } else {
            // SQLite backup plan (less likely to be needed on prod, but good safe-guard)
            // For SQLite, we might just rename since "CREATE LIKE" isn't standard
             DB::statement('CREATE TABLE listings AS SELECT * FROM items WHERE 1=0');
        }

        // 4. COPY DATA: Move all data from 'items' to 'listings'
        // This is safer than rename because it leaves 'items' as a backup!
        DB::statement('INSERT INTO listings SELECT * FROM items');

        // 5. Re-enable security checks
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
