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
     * Updates locations table to support hierarchical structure (City > Area).
     * - Adds type field to distinguish between cities and areas
     * - Adds parent_id for areas to reference their parent city
     * - Adds slug for SEO-friendly URLs
     * - Adds additional metadata fields
     * - Migrates existing locations to cities
     */
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            // Remove unique constraint on name first (areas can have same names in different cities)
            $table->dropUnique(['name']);
            
            // Add type field (city or area)
            $table->string('type')->nullable()->after('name');
            
            // Add slug for SEO-friendly URLs
            $table->string('slug')->nullable()->after('type');
            
            // Add parent_id for hierarchical structure (areas reference cities)
            $table->unsignedBigInteger('parent_id')->nullable()->after('slug');
            
            // Add additional metadata fields
            $table->text('description')->nullable()->after('parent_id');
            $table->boolean('is_active')->default(true)->after('description');
            $table->boolean('is_popular')->default(false)->after('is_active');
            $table->integer('sort_order')->default(0)->after('is_popular');
            
            // Rename 'order' to 'sort_order' if it exists, otherwise just use sort_order
            // We'll handle this in the migration logic below
        });
        
        // Migrate existing data: set all existing locations as cities
        DB::table('locations')->update([
            'type' => 'city',
            'slug' => DB::raw('LOWER(REPLACE(REPLACE(name, " ", "-"), "\'", ""))'),
            'sort_order' => DB::raw('`order`'),
            'is_active' => true,
        ]);
        
        // Generate proper slugs for existing locations
        $locations = DB::table('locations')->get();
        foreach ($locations as $location) {
            $slug = \Illuminate\Support\Str::slug($location->name);
            // Ensure slug is unique
            $count = DB::table('locations')->where('slug', $slug)->where('id', '!=', $location->id)->count();
            if ($count > 0) {
                $slug = $slug . '-' . $location->id;
            }
            DB::table('locations')->where('id', $location->id)->update(['slug' => $slug]);
        }
        
        // Add foreign key constraint for parent_id
        Schema::table('locations', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('locations')->onDelete('cascade');
            
            // Add indexes for performance
            $table->index('type');
            $table->index('parent_id');
            $table->index('slug');
            $table->index('is_active');
            $table->index('sort_order');
            
            // Add unique constraint on slug
            $table->unique('slug');
        });
        
        // Now that we have sort_order, we can drop the old 'order' column if desired
        // But we'll keep it for now in case there's code still using it
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex(['type']);
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['slug']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['sort_order']);
            
            // Drop foreign key
            $table->dropForeign(['parent_id']);
            
            // Drop unique constraint on slug
            $table->dropUnique(['slug']);
            
            // Drop columns
            $table->dropColumn([
                'type',
                'slug',
                'parent_id',
                'description',
                'is_active',
                'is_popular',
                'sort_order',
            ]);
            
            // Restore unique constraint on name
            $table->unique('name');
        });
    }
};
