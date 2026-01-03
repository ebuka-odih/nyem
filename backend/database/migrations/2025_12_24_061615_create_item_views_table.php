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
        Schema::create('item_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->uuid('user_id')->nullable()->constrained('users')->nullOnDelete(); // Nullable for unauthenticated views
            $table->string('ip_address')->nullable(); // Track IP for unauthenticated users
            $table->string('user_agent')->nullable(); // Track user agent for better uniqueness
            $table->timestamps();

            // Prevent duplicate views: same user viewing same item, or same IP viewing same item within 24 hours
            // We'll handle this logic in the application layer for better control
            $table->index(['item_id', 'user_id']);
            $table->index(['item_id', 'ip_address', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_views');
    }
};
