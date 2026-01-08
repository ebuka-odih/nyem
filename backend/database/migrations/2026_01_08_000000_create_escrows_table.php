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
        Schema::create('escrows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Participants
            $table->foreignUuid('buyer_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('seller_id')->constrained('users')->onDelete('cascade');
            
            // Transaction Details
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('NGN');
            $table->text('description')->nullable();
            
            // Payment Provider Details
            $table->string('payment_provider')->default('paystack');
            $table->string('paystack_reference')->nullable();
            $table->string('paystack_transfer_reference')->nullable(); // For settlement
            
            // State
            $table->enum('status', [
                'initiated',
                'payment_pending',
                'funds_locked',
                'service_in_progress',
                'delivery_confirmed',
                'released',
                'disputed',
                'refunded',
                'cancelled'
            ])->default('initiated');
            
            // Flags/Checkpoints
            $table->boolean('seller_notified')->default(false);
            $table->boolean('seller_acknowledged')->default(false);
            $table->boolean('buyer_confirmed')->default(false);
            $table->boolean('release_authorized')->default(false);
            $table->boolean('finalized')->default(false);
            $table->boolean('auto_released')->default(false);
            
            // Dispute Info
            $table->text('dispute_reason')->nullable();
            
            // Completion Info
            $table->text('completion_note')->nullable();
            
            // Timestamps for specific events
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('completed_at')->nullable(); // Service completed by seller
            $table->timestamp('confirmed_at')->nullable(); // Delivery confirmed by buyer
            $table->timestamp('authorized_at')->nullable(); // Release authorized by admin/system
            $table->timestamp('released_at')->nullable(); // Funds actually moved
            $table->timestamp('resolved_at')->nullable(); // Dispute resolved
            $table->timestamp('dispute_opened_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escrows');
    }
};
