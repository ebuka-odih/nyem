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
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('buy_request_id')->nullable()->constrained('buy_requests')->nullOnDelete();
            $table->uuid('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('seller_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['escrow', 'manual'])->default('escrow');
            $table->enum('status', ['pending', 'funds_held', 'awaiting_delivery', 'delivery_confirmed', 'completed', 'cancelled'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->timestamp('funds_held_at')->nullable();
            $table->timestamp('delivery_confirmed_at')->nullable();
            $table->timestamp('auto_release_at')->nullable(); // For auto-release after delivery time expires
            $table->timestamp('released_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('buyer_id');
            $table->index('seller_id');
            $table->index('buy_request_id');
            $table->index('status');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
