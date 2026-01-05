<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds main categories (Shop, Services, Swap) and their sub-categories.
     */
    public function run(): void
    {
        // Main categories
        $mainCategories = [
            ['id' => 1, 'name' => 'Shop'],
            ['id' => 2, 'name' => 'Services'],
            ['id' => 3, 'name' => 'Swap'],
        ];

        // Sub-categories organized by main category (keyed by lowercase main category name)
        $subCategories = [
            'Shop' => [
                'Electronics',
                'Accessories',
                'Fashion & Clothing',
                'Wigs & Hair',
                'Beauty & Care',
                'Phones & Gadgets',
                'Shoes & Bags',
                'Baby & Kids',
                'Food & Groceries',
                'Garden & Outdoor',
                'Home & Lifestyle',
                'Books & Media',
                'Sports',
            ],
            'Services' => [
                'Plumbing',
                'Electrical Repair',
                'AC Repair & Installation',
                'Generator Repair',
                'Carpenter',
                'Painter',
                'Cleaner / Housekeeping',
                'Mechanic',
                'Tailor / Fashion Designer',
                'Makeup Artist',
                'Hair Stylist',
                'Photographer / Videographer',
                'Tutor',
                'Welder',
                'POP / Tiling / Masonry',
            ],
            'Swap' => [
                'Phones',
                'Laptops',
                'Fashion Items',
                'Shoes',
                'Bags & Accessories',
                'Electronics',
                'Home Items',
                'Books',
                'Gadgets',
                'Miscellaneous',
            ],
        ];

        // Create main categories
        foreach ($mainCategories as $mainCategory) {
            $category = Category::updateOrCreate(
                ['id' => $mainCategory['id']],
                [
                    'name' => $mainCategory['name'],
                    'type' => 'main',
                    'slug' => Str::slug($mainCategory['name']),
                    'parent_id' => null,
                    'order' => $mainCategory['id'],
                ]
            );

            // Create sub-categories for this main category
            $subCategoryList = $subCategories[$mainCategory['name']] ?? [];

            foreach ($subCategoryList as $index => $subCategoryName) {
                // Check if category already exists
                $existingCategory = Category::where('name', $subCategoryName)
                    ->where('parent_id', $category->id)
                    ->first();
                
                // Generate slug - use existing slug if category exists, otherwise create new one
                if ($existingCategory && $existingCategory->slug) {
                    $slug = $existingCategory->slug;
                } else {
                    $baseSlug = Str::slug($subCategoryName);
                    $slug = $baseSlug;
                    
                    // If slug already exists for a different category, prefix with parent name
                    $existingSlugCategory = Category::where('slug', $slug)
                        ->where('id', '!=', $existingCategory?->id)
                        ->first();
                    
                    if ($existingSlugCategory) {
                        $slug = Str::slug($category->name) . '-' . $baseSlug;
                    }
                }
                
                Category::updateOrCreate(
                    [
                        'name' => $subCategoryName,
                        'parent_id' => $category->id,
                    ],
                    [
                        'type' => 'sub',
                        'slug' => $slug,
                        'parent_id' => $category->id,
                        'order' => $index + 1,
                    ]
                );
            }
        }
    }
}
