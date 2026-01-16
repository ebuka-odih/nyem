<?php

namespace Database\Factories;

use App\Models\Listing;
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
            'listing1_id' => Listing::factory()->for($userA, 'user'),
            'listing2_id' => Listing::factory()->for($userB, 'user'),
        ];
    }
}
