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

        // 1. Drop the redundant 'listings' table if it exists
        Schema::dropIfExists('listings');

        // 2. We must drop all foreign keys pointing to 'items' before renaming it on MySQL
        $tablesWithFks = [
            'listing_stats' => ['listing_id', 'item_id'],
            'swipes' => ['target_listing_id', 'offered_listing_id', 'target_item_id', 'offered_item_id'],
            'user_matches' => ['listing1_id', 'listing2_id', 'item1_id', 'item2_id'],
            'buy_requests' => ['listing_id', 'item_id'],
            'message_requests' => ['listing_id', 'item_id'],
            'transactions' => ['listing_id', 'item_id'],
            'reports' => ['target_listing_id', 'target_item_id'],
            'trade_offers' => ['offered_listing_id', 'target_listing_id', 'offered_item_id', 'target_item_id']
        ];

        foreach ($tablesWithFks as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $t) use ($table, $columns) {
                    foreach ($columns as $column) {
                        try {
                            // Try dropping the FK. MySQL often names them table_column_foreign
                            $t->dropForeign("{$table}_{$column}_foreign");
                        } catch (\Exception $e) {}
                    }
                });
            }
        }

        // 3. Now rename 'items' table to 'listings'
        if (Schema::hasTable('items') && !Schema::hasTable('listings')) {
            if ($driverName === 'sqlite') {
                DB::statement('ALTER TABLE items RENAME TO listings');
            } else {
                Schema::rename('items', 'listings');
            }
        }

        // 4. Re-create all foreign keys pointing to the new 'listings' table
        foreach ($tablesWithFks as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $t) use ($table, $columns) {
                    foreach ($columns as $column) {
                        if (Schema::hasColumn($table, $column)) {
                            try {
                                $t->foreign($column)->references('id')->on('listings')->cascadeOnDelete();
                            } catch (\Exception $e) {
                                \Log::warning("Could not recreate FK for {$table}.{$column}: " . $e->getMessage());
                            }
                        }
                    }
                });
            }
        }
    }

    public function down(): void {}
};
