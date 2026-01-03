<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'phone' => fake()->unique()->numerify('##########'),
            'username' => fake()->unique()->userName(),
            'bio' => fake()->sentence(),
            'profile_photo' => fake()->imageUrl(),
            'city' => fake()->city(),
            'role' => 'standard_user',
            'otp_verified_at' => now(),
            'password' => 'password',
        ];
    }

    /**
     * Indicate that the phone number is not verified yet.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'otp_verified_at' => null,
        ]);
    }
}
