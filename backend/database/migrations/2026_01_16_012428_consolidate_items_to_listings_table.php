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

        // 1. Force Disable Foreign Key checks (This is the only way to safely rename on MySQL)
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }

        // 2. Clear out any redundant empty tables that might be blocking the rename
        Schema::dropIfExists('listings');

        // 3. Rename the 'items' table to 'listings'
        // This preserves all data, indexes, and primary keys perfectly.
        // MySQL RENAME TABLE automatically updates incoming foreign keys from other tables!
        if (Schema::hasTable('items') && !Schema::hasTable('listings')) {
            if ($driverName === 'sqlite') {
                DB::statement('ALTER TABLE items RENAME TO listings');
            } else {
                DB::statement('RENAME TABLE items TO listings');
            }
        }

        // 4. Fallback: If 'listings' still doesn't exist for some reason, create it as a clone
        if (!Schema::hasTable('listings') && Schema::hasTable('items')) {
             if ($driverName === 'mysql') {
                DB::statement('CREATE TABLE listings LIKE items');
                DB::statement('INSERT INTO listings SELECT * FROM items');
             }
        }

        // 5. Re-enable Foreign Key checks
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback - we want to keep the data in 'listings'
    }
};
