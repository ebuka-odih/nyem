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
        Schema::create('swipes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('target_item_id')->constrained('items')->cascadeOnDelete();
            $table->enum('direction', ['left', 'right']);
            $table->timestamps();

            $table->unique(['from_user_id', 'target_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swipes');
    }
};
