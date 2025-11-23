<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Item;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\DemoDataSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $primary = User::factory()->create([
            'username' => 'demo',
            'phone' => '08000000000',
            'city' => 'Lagos',
            'password' => Hash::make('password'),
            'otp_verified_at' => now(),
        ]);

        $secondary = User::factory()->create([
            'username' => 'tester',
            'phone' => '08000000001',
            'city' => 'Abuja',
            'password' => Hash::make('password'),
            'otp_verified_at' => now(),
        ]);

        Item::factory(10)->create([
            'user_id' => $primary->id,
            'city' => $primary->city,
        ]);
        // Make some items in Abuja so secondary user can see a feed
        Item::factory(5)->create([
            'user_id' => $primary->id,
            'city' => 'Abuja',
        ]);
        Item::factory(10)->create([
            'user_id' => $secondary->id,
            'city' => $secondary->city,
        ]);

        $this->call(DemoDataSeeder::class);
    }
}
