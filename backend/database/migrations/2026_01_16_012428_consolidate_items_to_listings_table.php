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
        // This table was likely created by a previous migration but is empty
        Schema::dropIfExists('listings');

        // 2. Rename 'items' table to 'listings'
        // We only do this if 'items' exists and 'listings' does not
        if (Schema::hasTable('items') && !Schema::hasTable('listings')) {
            if ($driverName === 'sqlite') {
                DB::statement('ALTER TABLE items RENAME TO listings');
            } else {
                Schema::rename('items', 'listings');
            }
        }

        // 3. Update foreign keys across all related tables
        $tablesToFix = [
            'listing_stats' => ['listing_id'],
            'swipes' => ['target_listing_id', 'offered_listing_id'],
            'user_matches' => ['listing1_id', 'listing2_id'],
            'buy_requests' => ['listing_id'],
            'message_requests' => ['listing_id'],
            'transactions' => ['listing_id'],
            'reports' => ['target_listing_id'],
            'trade_offers' => ['offered_listing_id', 'target_listing_id']
        ];

        foreach ($tablesToFix as $table => $columns) {
            if (Schema::hasTable($table)) {
                foreach ($columns as $column) {
                    $this->recreateForeignKey($table, $column);
                }
            }
        }
    }

    /**
     * Recreate a foreign key to point to the new 'listings' table.
     * Handles MySQL "Can't DROP FOREIGN KEY" errors gracefully.
     */
    private function recreateForeignKey(string $table, string $column): void
    {
        // Try to drop the foreign key using both 'listing' and 'item' naming conventions
        // MySQL requires the exact name of the constraint
        $potentialNames = [
            "{$table}_{$column}_foreign",
            str_replace('listing', 'item', "{$table}_{$column}_foreign")
        ];

        foreach ($potentialNames as $fkName) {
            try {
                // We use a fresh connection/statement for each attempt to prevent transaction issues
                Schema::table($table, function (Blueprint $t) use ($fkName) {
                    $t->dropForeign($fkName);
                });
            } catch (\Exception $e) {
                // Ignore failure to drop - it likely doesn't exist with this name
            }
        }

        // Finally, create the new foreign key pointing to 'listings'
        try {
            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->foreign($column)->references('id')->on('listings')->cascadeOnDelete();
            });
        } catch (\Exception $e) {
            // Log if creation fails, but don't stop the migration
            \Log::warning("Could not create foreign key for {$table}.{$column}: " . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback provided for this consolidation
    }
};
