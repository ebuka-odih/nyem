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
     * Consolidates Item model into Listing model:
     * 1. Drops redundant listings table (empty)
     * 2. Renames items table to listings
     * 3. Converts enum fields to string (for MySQL/PostgreSQL)
     * 4. Renames all item_id columns to listing_id across related tables
     * 5. Renames item_stats table to listing_stats
     */
    public function up(): void
    {
        $driverName = DB::getDriverName();
        
        // Step 1: Drop redundant listings table (empty)
        Schema::dropIfExists('listings');
        
        // Step 2: Rename items table to listings
        if ($driverName === 'sqlite') {
            DB::statement('ALTER TABLE items RENAME TO listings');
        } else {
            DB::statement('RENAME TABLE items TO listings');
        }
        
        // Step 3: Convert enum fields to string (for MySQL/PostgreSQL only, SQLite stores as text anyway)
        if ($driverName !== 'sqlite') {
            if (Schema::hasColumn('listings', 'condition')) {
                DB::statement('ALTER TABLE listings MODIFY COLUMN `condition` VARCHAR(255) NOT NULL');
            }
            if (Schema::hasColumn('listings', 'status')) {
                DB::statement('ALTER TABLE listings MODIFY COLUMN `status` VARCHAR(255) NOT NULL DEFAULT "active"');
            }
            if (Schema::hasColumn('listings', 'type')) {
                DB::statement('ALTER TABLE listings MODIFY COLUMN `type` VARCHAR(255) NOT NULL DEFAULT "barter"');
            }
        }
        
        // Step 4: Rename foreign key columns in related tables
        $this->renameForeignKeyColumns($driverName);
        
        // Step 5: Rename item_stats table to listing_stats
        if ($driverName === 'sqlite') {
            DB::statement('ALTER TABLE item_stats RENAME TO listing_stats');
        } else {
            DB::statement('RENAME TABLE item_stats TO listing_stats');
        }
    }

    /**
     * Rename all item_id foreign key columns to listing_id
     */
    private function renameForeignKeyColumns(string $driverName): void
    {
        // Helper function to rename column and foreign key
        $renameColumn = function (string $table, string $oldColumn, string $newColumn, bool $nullable = false) use ($driverName) {
            // Drop foreign key
            try {
                Schema::table($table, function (Blueprint $t) use ($oldColumn) {
                    $t->dropForeign([$oldColumn]);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist, continue
            }
            
            // Rename column
            if ($driverName === 'sqlite') {
                DB::statement("ALTER TABLE {$table} RENAME COLUMN {$oldColumn} TO {$newColumn}");
            } else {
                Schema::table($table, function (Blueprint $t) use ($oldColumn, $newColumn) {
                    $t->renameColumn($oldColumn, $newColumn);
                });
            }
            
            // Re-add foreign key
            Schema::table($table, function (Blueprint $t) use ($newColumn, $nullable) {
                $foreign = $t->foreign($newColumn)->references('id')->on('listings');
                if ($nullable) {
                    $foreign->nullOnDelete();
                } else {
                    $foreign->cascadeOnDelete();
                }
            });
        };
        
        // swipes table
        if (Schema::hasColumn('swipes', 'target_item_id')) {
            $renameColumn('swipes', 'target_item_id', 'target_listing_id');
        }
        if (Schema::hasColumn('swipes', 'offered_item_id')) {
            $renameColumn('swipes', 'offered_item_id', 'offered_listing_id', true);
        }
        
        // user_matches table
        if (Schema::hasColumn('user_matches', 'item1_id')) {
            $renameColumn('user_matches', 'item1_id', 'listing1_id');
        }
        if (Schema::hasColumn('user_matches', 'item2_id')) {
            $renameColumn('user_matches', 'item2_id', 'listing2_id');
        }
        
        // trade_offers table
        if (Schema::hasColumn('trade_offers', 'offered_item_id')) {
            $renameColumn('trade_offers', 'offered_item_id', 'offered_listing_id');
        }
        if (Schema::hasColumn('trade_offers', 'target_item_id')) {
            $renameColumn('trade_offers', 'target_item_id', 'target_listing_id');
        }
        
        // buy_requests table
        if (Schema::hasColumn('buy_requests', 'item_id')) {
            $renameColumn('buy_requests', 'item_id', 'listing_id');
        }
        
        // message_requests table
        if (Schema::hasColumn('message_requests', 'item_id')) {
            $renameColumn('message_requests', 'item_id', 'listing_id');
        }
        
        // item_stats table (will be renamed to listing_stats, so handle listing_id)
        if (Schema::hasColumn('item_stats', 'item_id')) {
            // Drop foreign key
            try {
                Schema::table('item_stats', function (Blueprint $t) {
                    $t->dropForeign(['item_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            
            // Rename column
            if ($driverName === 'sqlite') {
                DB::statement('ALTER TABLE item_stats RENAME COLUMN item_id TO listing_id');
            } else {
                Schema::table('item_stats', function (Blueprint $t) {
                    $t->renameColumn('item_id', 'listing_id');
                });
            }
            
            // Re-add foreign key
            Schema::table('item_stats', function (Blueprint $t) {
                $t->foreign('listing_id')->references('id')->on('listings')->cascadeOnDelete();
            });
        }
        
        // transactions table
        if (Schema::hasColumn('transactions', 'item_id')) {
            $renameColumn('transactions', 'item_id', 'listing_id');
        }
        
        // reports table
        if (Schema::hasColumn('reports', 'target_item_id')) {
            $renameColumn('reports', 'target_item_id', 'target_listing_id', true);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driverName = DB::getDriverName();
        
        // Reverse Step 5: Rename listing_stats back to item_stats
        if ($driverName === 'sqlite') {
            DB::statement('ALTER TABLE listing_stats RENAME TO item_stats');
        } else {
            DB::statement('RENAME TABLE listing_stats TO item_stats');
        }
        
        // Reverse Step 4: Rename foreign key columns back (simplified - would need full implementation)
        // Note: Full rollback would require restoring all foreign keys and columns
        // This is a simplified rollback - full implementation would be complex
        
        // Reverse Step 3: Convert strings back to enum (would require hardcoding values - skipped)
        
        // Reverse Step 2: Rename listings back to items
        if ($driverName === 'sqlite') {
            DB::statement('ALTER TABLE listings RENAME TO items');
        } else {
            DB::statement('RENAME TABLE listings TO items');
        }
        
        // Reverse Step 1: Original listings table was empty, so no recreation needed
    }
};
