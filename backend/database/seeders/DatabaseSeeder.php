<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Listing;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\LocationSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed categories and locations first
        $this->call(CategorySeeder::class);
        $this->call(LocationSeeder::class);
        $this->call(AdminUserSeeder::class);

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
            'city' => 'Lagos', // Same city as demo user for easier testing
            'password' => Hash::make('password'),
            'otp_verified_at' => now(),
        ]);

        Listing::factory(10)->create([
            'user_id' => $primary->id,
            'city' => $primary->city,
        ]);
        // Make some items in Abuja so secondary user can see a feed
        Listing::factory(5)->create([
            'user_id' => $primary->id,
            'city' => 'Abuja',
        ]);
        Listing::factory(10)->create([
            'user_id' => $secondary->id,
            'city' => $secondary->city,
        ]);

        $this->call(DemoDataSeeder::class);
    }
}
