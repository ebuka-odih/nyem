<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds latitude and longitude fields to locations table for areas.
     * This allows storing coordinates for each area, which can be used
     * to calculate distances for items and users.
     */
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            // DECIMAL(10,7) provides precision up to 1cm for GPS coordinates
            $table->decimal('latitude', 10, 7)->nullable()->after('sort_order');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            
            // Indexes for fast spatial queries
            $table->index('latitude', 'locations_latitude_index');
            $table->index('longitude', 'locations_longitude_index');
            $table->index(['latitude', 'longitude'], 'locations_location_composite_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropIndex('locations_location_composite_index');
            $table->dropIndex('locations_longitude_index');
            $table->dropIndex('locations_latitude_index');
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
