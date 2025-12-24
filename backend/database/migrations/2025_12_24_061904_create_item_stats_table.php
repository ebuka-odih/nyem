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
        Schema::create('item_stats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->uuid('user_id')->nullable()->constrained('users')->nullOnDelete(); // Nullable for unauthenticated views
            $table->enum('type', ['view', 'like', 'share']); // Type of interaction
            $table->string('ip_address')->nullable(); // Track IP for unauthenticated users
            $table->string('user_agent')->nullable(); // Track user agent for better uniqueness
            $table->uuid('swipe_id')->nullable()->constrained('swipes')->nullOnDelete(); // Reference to swipe if this is a like
            $table->timestamps();

            // Indexes for efficient queries
            $table->index(['item_id', 'type']);
            $table->index(['item_id', 'user_id', 'type']);
            $table->index(['item_id', 'ip_address', 'type', 'created_at']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_stats');
    }
};
