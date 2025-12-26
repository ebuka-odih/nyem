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
        Schema::create('buy_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('seller_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->string('location')->nullable(); // Buyer's location
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            // Ensure one buy request per buyer-seller-item combination
            $table->unique(['buyer_id', 'seller_id', 'item_id'], 'unique_buy_request');
            
            // Indexes for performance
            $table->index('seller_id');
            $table->index('buyer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buy_requests');
    }
};
