<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates service_providers table for artisans and service professionals.
     * Each user can have one service provider profile.
     */
    public function up(): void
    {
        Schema::create('service_providers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('service_category_id')->constrained('categories')->cascadeOnDelete();
            $table->decimal('starting_price', 10, 2)->nullable();
            $table->string('city');
            $table->json('work_images')->nullable(); // Array of work sample image URLs
            $table->text('bio')->nullable();
            $table->enum('availability', ['available', 'busy', 'unavailable'])->default('available');
            $table->decimal('rating', 3, 2)->default(0.00)->comment('Average rating from 0.00 to 5.00');
            $table->integer('rating_count')->default(0)->comment('Number of ratings received');
            $table->timestamps();
            
            // Indexes for common queries
            $table->index('user_id');
            $table->index('service_category_id');
            $table->index('city');
            $table->index('availability');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_providers');
    }
};
