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

        // 1. Drop the redundant empty 'listings' table if it exists
        Schema::dropIfExists('listings');

        // 2. Clear out all potential foreign keys pointing to 'items' or using 'listing' names
        // In MySQL, we MUST do these in separate Schema::table calls to handle errors gracefully
        $fkMap = [
            'listing_stats' => ['listing_id', 'item_id'],
            'swipes' => ['target_listing_id', 'offered_listing_id', 'target_item_id', 'offered_item_id'],
            'user_matches' => ['listing1_id', 'listing2_id', 'item1_id', 'item2_id'],
            'buy_requests' => ['listing_id', 'item_id'],
            'message_requests' => ['listing_id', 'item_id'],
            'transactions' => ['listing_id', 'item_id'],
            'reports' => ['target_listing_id', 'target_item_id'],
            'trade_offers' => ['offered_listing_id', 'target_listing_id', 'offered_item_id', 'target_item_id']
        ];

        foreach ($fkMap as $table => $columns) {
            if (!Schema::hasTable($table)) continue;

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) continue;

                $fkName = "{$table}_{$column}_foreign";
                
                try {
                    // SEPARATE call for every drop to prevent MySQL SQLSTATE[42000] from stopping the migration
                    Schema::table($table, function (Blueprint $t) use ($fkName) {
                        $t->dropForeign($fkName);
                    });
                } catch (\Exception $e) {
                    // Ignore: Foreign key likely doesn't exist with this specific name
                }
            }
        }

        // 3. Perform the rename now that table 'items' is unlocked
        if (Schema::hasTable('items') && !Schema::hasTable('listings')) {
            if ($driverName === 'sqlite') {
                DB::statement('ALTER TABLE items RENAME TO listings');
            } else {
                Schema::rename('items', 'listings');
            }
        }

        // 4. Re-establish foreign keys pointing to the new 'listings' table
        foreach ($fkMap as $table => $columns) {
            if (!Schema::hasTable($table)) continue;

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) continue;

                try {
                    Schema::table($table, function (Blueprint $t) use ($column) {
                        $t->foreign($column)->references('id')->on('listings')->cascadeOnDelete();
                    });
                } catch (\Exception $e) {
                    // Log but don't crash
                    \Log::info("Skip recreated FK for {$table}.{$column}: " . $e->getMessage());
                }
            }
        }
    }

    public function down(): void {}
};
