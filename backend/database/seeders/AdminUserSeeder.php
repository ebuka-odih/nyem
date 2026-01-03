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
     * Default credentials:
     * - Email: admin@nyem.online
     * - Password: ADMIN12345
     * - Username: admin
     * 
     * Environment variables (optional overrides):
     * - ADMIN_EMAIL: Override admin email
     * - ADMIN_PASSWORD: Override admin password
     * - ADMIN_USERNAME: Override admin username
     * - ADMIN_CITY: Override admin city
     * 
     * Usage: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        // Default values - can be overridden by environment variables
        $email = env('ADMIN_EMAIL', 'admin@nyem.online');
        $password = env('ADMIN_PASSWORD', 'ADMINPASS123');
        $username = env('ADMIN_USERNAME', 'admin');
        $city = env('ADMIN_CITY', 'Admin City');

        $admin = User::where('role', 'admin')
            ->where('email', $email)
            ->first();
        
        if ($admin) {
            $this->command->info('Admin user already exists: ' . ($admin->email ?? $admin->username ?? 'N/A'));
            
            $this->updateAdminUser($admin, $password);
            return;
        }

        $this->createAdminUser($email, $username, $password, $city);
    }

    /**
     * Create a new admin user
     */
    private function createAdminUser(string $email, string $username, string $password, string $city): void
    {
        try {
            // Create user first
            $admin = new User([
                'email' => $email,
                'username' => $username,
                'city' => $city,
                'role' => 'admin',
                'email_verified_at' => now(),
                'otp_verified_at' => now(),
            ]);
            
            // Set password directly on attributes to bypass the 'hashed' cast
            // This ensures we have full control over the hash
            $admin->setAttribute('password', Hash::make($password));
            $admin->save();

            $this->command->info('Admin user created successfully!');
            $this->command->info('Email: ' . $admin->email);
            
            $this->verifyPassword($admin, $password);
        } catch (\Exception $e) {
            $this->command->error('Failed to create admin user: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update existing admin user password
     */
    private function updateAdminUser(User $admin, string $password): void
    {
        $this->command->info('Updating admin user credentials...');
        
        // Set password directly on attributes to bypass the 'hashed' cast
        // This ensures we have full control over the hash
        $admin->setAttribute('password', Hash::make($password));
        $admin->email_verified_at = now();
        $admin->save();
        
        $this->verifyPassword($admin, $password);
    }

    /**
     * Verify that the password hash works correctly
     */
    private function verifyPassword(User $admin, string $password): void
    {
        // Get raw password hash from database attributes
        $passwordHash = $admin->getAttributes()['password'] ?? $admin->getOriginal('password') ?? $admin->password;
        
        if (Hash::check($password, $passwordHash)) {
            $this->command->info('✓ Password verified successfully');
        } else {
            $this->command->error('✗ Password verification failed!');
            $this->command->warn('Please check that ADMIN_PASSWORD in .env matches the password you are using to login.');
        }
    }
}

















