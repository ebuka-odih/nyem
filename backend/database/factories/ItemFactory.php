<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Item>
 */
class ItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get a random category ID (prefer sub-categories, fallback to main categories)
        $category = Category::inRandomOrder()->first() ?? Category::first();
        
        return [
            'user_id' => User::factory(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'category_id' => $category?->id ?? 1, // Fallback to category ID 1 if no categories exist
            'condition' => fake()->randomElement(['new', 'like_new', 'used']),
            'photos' => [fake()->imageUrl()],
            'looking_for' => fake()->words(3, true),
            'city' => fake()->city(),
            'status' => 'active',
            'type' => fake()->randomElement(['barter', 'marketplace']),
        ];
    }
}
