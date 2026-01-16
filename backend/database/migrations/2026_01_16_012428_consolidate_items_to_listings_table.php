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

        // 1. Drop the empty and redundant 'listings' table
        Schema::dropIfExists('listings');

        // 2. Rename 'items' table to 'listings'
        if ($driverName === 'sqlite') {
            DB::statement('ALTER TABLE items RENAME TO listings');
        } else {
            Schema::rename('items', 'listings');
        }

        // 3. Fix foreign keys in listing_stats
        // We need to make sure the foreign key points to the new 'listings' table (which was 'items')
        if (Schema::hasTable('listing_stats')) {
            try {
                Schema::table('listing_stats', function (Blueprint $table) {
                    $table->dropForeign(['listing_id']);
                });
            } catch (\Exception $e) {
                // Ignore if foreign key doesn't exist
            }

            Schema::table('listing_stats', function (Blueprint $table) {
                $table->foreign('listing_id')->references('id')->on('listings')->cascadeOnDelete();
            });
        }
        
        // 4. Update other tables that might be pointing to the wrong table
        $tablesToFix = [
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
                Schema::table($table, function (Blueprint $t) use ($table, $columns) {
                    foreach ($columns as $column) {
                        try {
                            $t->dropForeign([$column]);
                        } catch (\Exception $e) {}
                    }
                });

                Schema::table($table, function (Blueprint $t) use ($table, $columns) {
                    foreach ($columns as $column) {
                        $t->foreign($column)->references('id')->on('listings')->cascadeOnDelete();
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversing this is complex because it involves table renaming and FK recreation.
        // For local development, we'll keep it simple or skip.
    }
};
