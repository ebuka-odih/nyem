<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Category;
use App\Models\Item;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds category_id foreign key to items table and migrates existing category string values.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Add category_id column as nullable first
            $table->unsignedBigInteger('category_id')->nullable()->after('category');
            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            $table->index('category_id');
        });

        // Migrate existing category string values to category_id
        // Match category names from items.category to categories.name
        $items = DB::table('items')->whereNotNull('category')->get();
        
        foreach ($items as $item) {
            // Try to find category by name (check both main and sub categories)
            $category = Category::where('name', $item->category)->first();
            
            if ($category) {
                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['category_id' => $category->id]);
            } else {
                // If category doesn't exist, try to find a default category
                // Use the first main category as fallback, or create a default
                $defaultCategory = Category::where('type', 'main')->first();
                if ($defaultCategory) {
                    DB::table('items')
                        ->where('id', $item->id)
                        ->update(['category_id' => $defaultCategory->id]);
                }
            }
        }

        // Now make category_id required and drop the old category column
        Schema::table('items', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable(false)->change();
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Add back category column
            $table->string('category')->after('category_id');
        });

        // Migrate category_id back to category string
        $items = DB::table('items')->whereNotNull('category_id')->get();
        
        foreach ($items as $item) {
            $category = Category::find($item->category_id);
            if ($category) {
                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['category' => $category->name]);
            }
        }

        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
