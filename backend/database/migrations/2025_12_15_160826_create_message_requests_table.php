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
        Schema::create('message_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->text('message_text');
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            // Ensure one message request per buyer-seller-item combination
            $table->unique(['from_user_id', 'to_user_id', 'item_id'], 'unique_message_request');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_requests');
    }
};
