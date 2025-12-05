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
        Schema::table('items', function (Blueprint $table) {
            // Add type field: 'barter' (default) or 'marketplace'
            $table->enum('type', ['barter', 'marketplace'])->default('barter')->after('status');
            
            // Add price field for marketplace items (nullable since barter items don't have price)
            $table->decimal('price', 10, 2)->nullable()->after('type');
            
            // Make looking_for nullable for marketplace items
            $table->string('looking_for')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['type', 'price']);
            // Revert looking_for to required if needed
            $table->string('looking_for')->nullable(false)->change();
        });
    }
};
