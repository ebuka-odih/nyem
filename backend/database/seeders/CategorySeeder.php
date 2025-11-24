<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Electronics',
            'Fashion',
            'Household',
            'Food Items',
            'Accessories',
            'Beauty',
            'Baby/Kids',
            'Books',
            'Sports',
            'Other',
        ];

        foreach ($categories as $index => $name) {
            Category::firstOrCreate(
                ['name' => $name],
                ['order' => $index + 1]
            );
        }
    }
}
