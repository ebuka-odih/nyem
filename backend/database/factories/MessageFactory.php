<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserMatch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'match_id' => UserMatch::factory(),
            'sender_id' => User::factory(),
            'receiver_id' => User::factory(),
            'message_text' => fake()->sentence(),
        ];
    }
}
