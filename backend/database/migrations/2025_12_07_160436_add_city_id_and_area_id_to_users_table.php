<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds city_id and area_id foreign keys to users table.
     * These reference the locations table for hierarchical location data.
     * The existing 'city' string field is kept for backward compatibility.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add city_id foreign key (references locations where type='city')
            $table->unsignedBigInteger('city_id')->nullable()->after('city');
            
            // Add area_id foreign key (references locations where type='area')
            $table->unsignedBigInteger('area_id')->nullable()->after('city_id');
            
            // Add indexes for performance
            $table->index('city_id');
            $table->index('area_id');
        });
        
        // Add foreign key constraints after columns are created
        // Note: We can't enforce type='city' or type='area' in foreign keys,
        // but application logic should ensure correct references
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('city_id')
                ->references('id')
                ->on('locations')
                ->onDelete('set null');
                
            $table->foreign('area_id')
                ->references('id')
                ->on('locations')
                ->onDelete('set null');
        });
        
        // Optional: Migrate existing city string data to city_id where possible
        // This will try to match existing city strings to location names
        $users = DB::table('users')->whereNotNull('city')->get();
        foreach ($users as $user) {
            // Try to find matching city by name
            $city = DB::table('locations')
                ->where('type', 'city')
                ->where('name', $user->city)
                ->first();
            
            if ($city) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['city_id' => $city->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['city_id']);
            $table->dropForeign(['area_id']);
            
            // Drop indexes
            $table->dropIndex(['city_id']);
            $table->dropIndex(['area_id']);
            
            // Drop columns
            $table->dropColumn(['city_id', 'area_id']);
        });
    }
};
