<?php

namespace Database\Factories;

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
        return [
            'user_id' => User::factory(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'category' => fake()->randomElement(['Electronics', 'Fashion', 'Accessories', 'Other']),
            'condition' => fake()->randomElement(['new', 'like_new', 'used']),
            'photos' => [fake()->imageUrl()],
            'looking_for' => fake()->words(3, true),
            'city' => fake()->city(),
            'status' => 'active',
        ];
    }
}
