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
            $this->command->info('Admin user already exists: ' . ($admin->email ?? $admin->username ?? 'N/A'));
            if ($admin->email) {
                $this->command->info('Email: ' . $admin->email);
            }
            return;
        }

        // Create admin user with email
        // Note: Don't use Hash::make() here because User model has 'password' => 'hashed' cast
        // The cast will automatically hash the password when setting it
        $admin = User::create([
            'email' => 'admin@nyem.com', // Change this to your admin email
            'username' => 'admin',
            'city' => 'Admin City',
            'role' => 'admin',
            'email_verified_at' => now(), // Required for email-based login
            'otp_verified_at' => now(), // Keep for backward compatibility
            'password' => 'admin123', // The 'hashed' cast will hash this automatically
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: ' . $admin->email);
        $this->command->info('Username: ' . $admin->username);
        $this->command->info('Password: admin123');
        $this->command->warn('⚠️  IMPORTANT: Please change the default password after first login!');
    }
}

















