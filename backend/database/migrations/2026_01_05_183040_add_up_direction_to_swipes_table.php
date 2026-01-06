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
        // Add 'up' direction to the enum
        // For MySQL/PostgreSQL
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE swipes MODIFY COLUMN direction ENUM('left', 'right', 'up') NOT NULL");
        }
        // SQLite doesn't enforce enum types, so this is handled in the model
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'up' direction from the enum
        if (DB::getDriverName() !== 'sqlite') {
            // First, update any 'up' swipes to 'right' to avoid data loss
            DB::table('swipes')->where('direction', 'up')->update(['direction' => 'right']);
            // Then modify the enum
            DB::statement("ALTER TABLE swipes MODIFY COLUMN direction ENUM('left', 'right') NOT NULL");
        }
    }
};
