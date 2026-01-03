<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migrate existing data from item_views and swipes to item_stats
     */
    public function up(): void
    {
        // Check if item_views table exists and migrate views
        if (Schema::hasTable('item_views')) {
            DB::statement("
                INSERT INTO item_stats (id, item_id, user_id, type, ip_address, user_agent, created_at, updated_at)
                SELECT id, item_id, user_id, 'view', ip_address, user_agent, created_at, updated_at
                FROM item_views
            ");
        }

        // Migrate likes from swipes (right swipes = likes)
        if (Schema::hasTable('swipes')) {
            $swipes = DB::table('swipes')
                ->where('direction', 'right')
                ->get();

            foreach ($swipes as $swipe) {
                // Check if like already exists
                $exists = DB::table('item_stats')
                    ->where('item_id', $swipe->target_item_id)
                    ->where('user_id', $swipe->from_user_id)
                    ->where('type', 'like')
                    ->where('swipe_id', $swipe->id)
                    ->exists();

                if (!$exists) {
                    DB::table('item_stats')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'item_id' => $swipe->target_item_id,
                        'user_id' => $swipe->from_user_id,
                        'type' => 'like',
                        'swipe_id' => $swipe->id,
                        'created_at' => $swipe->created_at,
                        'updated_at' => $swipe->updated_at,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is one-way - we don't restore data back to old tables
        // The old tables will be dropped in a separate migration
    }
};
