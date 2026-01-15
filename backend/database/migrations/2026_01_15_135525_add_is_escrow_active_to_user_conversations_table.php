<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_conversations', function (Blueprint $table) {
            $table->boolean('is_escrow_active')->default(false)->after('user2_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_conversations', function (Blueprint $table) {
            $table->dropColumn('is_escrow_active');
        });
    }
};
