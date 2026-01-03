<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserMatch>
 */
class UserMatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $userA = User::factory();
        $userB = User::factory();

        return [
            'user1_id' => $userA,
            'user2_id' => $userB,
            'item1_id' => Item::factory()->for($userA, 'user'),
            'item2_id' => Item::factory()->for($userB, 'user'),
        ];
    }
}
