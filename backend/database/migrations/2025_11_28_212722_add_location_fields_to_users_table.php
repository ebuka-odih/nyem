<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds location fields to users table:
     * - latitude: DECIMAL(10,7) for precise GPS coordinates (-90 to 90)
     * - longitude: DECIMAL(10,7) for precise GPS coordinates (-180 to 180)
     * - location_updated_at: timestamp to track when location was last updated
     * 
     * Indexes are added on latitude and longitude for fast spatial queries
     * using the Haversine formula. A composite index is also created for
     * efficient distance-based filtering and sorting.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // DECIMAL(10,7) provides precision up to 1cm for GPS coordinates
            // This is the standard for storing latitude/longitude in MySQL
            $table->decimal('latitude', 10, 7)->nullable()->after('city');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->timestamp('location_updated_at')->nullable()->after('longitude');
            
            // Individual indexes for latitude and longitude
            // These help with bounding box queries and spatial filtering
            $table->index('latitude', 'users_latitude_index');
            $table->index('longitude', 'users_longitude_index');
            
            // Composite index for efficient distance-based queries
            // MySQL can use this for both filtering and sorting by distance
            $table->index(['latitude', 'longitude'], 'users_location_composite_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes first (MySQL requirement)
            $table->dropIndex('users_location_composite_index');
            $table->dropIndex('users_longitude_index');
            $table->dropIndex('users_latitude_index');
            
            // Then drop columns
            $table->dropColumn(['latitude', 'longitude', 'location_updated_at']);
        });
    }
};
