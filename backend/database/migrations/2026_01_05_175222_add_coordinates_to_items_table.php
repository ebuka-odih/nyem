<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds latitude and longitude fields to items table.
     * These coordinates represent the location of the item (seller's area).
     * This allows filtering items by distance from the user's location.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // DECIMAL(10,7) provides precision up to 1cm for GPS coordinates
            $table->decimal('latitude', 10, 7)->nullable()->after('city');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            
            // Indexes for fast spatial queries
            $table->index('latitude', 'items_latitude_index');
            $table->index('longitude', 'items_longitude_index');
            $table->index(['latitude', 'longitude'], 'items_location_composite_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('items_location_composite_index');
            $table->dropIndex('items_longitude_index');
            $table->dropIndex('items_latitude_index');
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
