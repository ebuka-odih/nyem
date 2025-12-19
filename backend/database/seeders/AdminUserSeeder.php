<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates a default admin user for testing the admin system.
     * 
     * Usage: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        // Check if admin user already exists
        $admin = User::where('role', 'admin')->first();
        
        if ($admin) {
            $this->command->info('Admin user already exists: ' . $admin->username . ' (' . $admin->phone . ')');
            return;
        }

        // Create admin user
        $admin = User::create([
            'phone' => '1234567890', // Change this to your phone number
            'username' => 'admin',
            'city' => 'Admin City',
            'role' => 'admin',
            'otp_verified_at' => now(),
            'password' => Hash::make('admin123'), // Change this password
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Phone: ' . $admin->phone);
        $this->command->info('Username: ' . $admin->username);
        $this->command->warn('Please change the default password after first login!');
    }
}














