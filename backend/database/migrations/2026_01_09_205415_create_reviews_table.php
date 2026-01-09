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
        Schema::create('reviews', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->foreignUuid('reviewer_id')->constrained('users')->onDelete('cascade');
            $blueprint->foreignUuid('receiver_id')->constrained('users')->onDelete('cascade');
            $blueprint->integer('rating')->default(5);
            $blueprint->text('comment')->nullable();
            $blueprint->timestamps();

            // Prevent duplicate reviews from the same user for the same seller
            $blueprint->unique(['reviewer_id', 'receiver_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
