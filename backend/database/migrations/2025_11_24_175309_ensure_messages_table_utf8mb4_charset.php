<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensure message_text column uses utf8mb4 charset for emoji support
     */
    public function up(): void
    {
        // For MySQL/MariaDB, ensure the message_text column uses utf8mb4
        if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb') {
            DB::statement('ALTER TABLE `messages` MODIFY `message_text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to utf8 if needed (though we probably don't want to do this)
        if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb') {
            DB::statement('ALTER TABLE `messages` MODIFY `message_text` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci');
        }
    }
};
