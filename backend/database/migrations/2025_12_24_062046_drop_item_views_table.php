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
        // Drop item_views table after data has been migrated to item_stats
        if (Schema::hasTable('item_views')) {
            Schema::dropIfExists('item_views');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate item_views table structure (data won't be restored)
        Schema::create('item_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->uuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['item_id', 'user_id']);
            $table->index(['item_id', 'ip_address', 'created_at']);
        });
    }
};
