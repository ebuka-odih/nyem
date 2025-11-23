<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['phone' => '08000000000'],
            [
                'username' => 'demo',
                'city' => 'Lagos',
                'password' => Hash::make('password'),
                'otp_verified_at' => now(),
                'role' => 'standard_user',
                'bio' => 'I love swapping cool gadgets.',
                'profile_photo' => 'https://via.placeholder.com/150',
            ],
        );

        if (Item::where('user_id', $user->id)->count() < 5) {
            Item::factory(5)->create([
                'user_id' => $user->id,
                'city' => $user->city,
            ]);
        }
    }
}
