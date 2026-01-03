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
        Schema::create('trade_offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('offered_item_id')->constrained('items')->cascadeOnDelete();
            $table->uuid('target_item_id')->constrained('items')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            $table->unique(['from_user_id', 'to_user_id', 'offered_item_id', 'target_item_id'], 'unique_trade_offer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trade_offers');
    }
};
