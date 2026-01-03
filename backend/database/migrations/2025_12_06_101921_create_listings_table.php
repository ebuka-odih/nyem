<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates listings table for Shop and Swap items.
     * Listings can be either 'shop' (for sale) or 'swap' (for trade).
     */
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('category_id')->constrained('categories')->cascadeOnDelete();
            $table->enum('type', ['shop', 'swap'])->default('shop');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->nullable(); // Nullable for swap items
            $table->string('location');
            $table->json('images')->nullable(); // Array of image URLs
            $table->enum('condition', ['new', 'like_new', 'used', 'fair'])->default('used');
            $table->enum('status', ['active', 'pending', 'paused'])->default('active');
            $table->timestamps();
            
            // Indexes for common queries
            $table->index('user_id');
            $table->index('category_id');
            $table->index('type');
            $table->index('status');
            $table->index(['type', 'status']); // Composite index for filtering by type and status
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
