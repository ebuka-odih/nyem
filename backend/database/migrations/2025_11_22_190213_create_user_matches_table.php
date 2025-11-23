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
        Schema::create('user_matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user1_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('user2_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('item1_id')->constrained('items')->cascadeOnDelete();
            $table->uuid('item2_id')->constrained('items')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user1_id', 'user2_id', 'item1_id', 'item2_id'], 'unique_match_between_users_and_items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_matches');
    }
};
