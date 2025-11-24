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

        // Delete existing items for demo user to replace with real items
        Item::where('user_id', $user->id)->delete();

        // Create 5 real items for the demo user
        $items = [
            [
                'title' => 'Phone',
                'description' => 'Samsung Galaxy S21, 128GB. Excellent condition with screen protector.',
                'category' => 'Electronics',
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
                'looking_for' => 'Laptop or tablet',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Laptop',
                'description' => 'HP Pavilion 15, Intel i5, 8GB RAM, 256GB SSD. Good for work and study.',
                'category' => 'Electronics',
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
                'looking_for' => 'Phone or camera',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Dress',
                'description' => 'Elegant blue evening dress, size M. Perfect for parties and events.',
                'category' => 'Fashion',
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
                'looking_for' => 'Shoes or handbag',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Blender',
                'description' => 'Powerful kitchen blender, great for smoothies and juices. Works perfectly.',
                'category' => 'Other',
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'],
                'looking_for' => 'Microwave or toaster',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Plant bucket',
                'description' => 'Large decorative plant bucket, perfect for indoor plants. Modern design.',
                'category' => 'Other',
                'condition' => 'new',
                'photos' => ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'],
                'looking_for' => 'Garden tools or pots',
                'city' => 'Abuja',
                'status' => 'active',
            ],
        ];

        foreach ($items as $itemData) {
            Item::create([
                'user_id' => $user->id,
                ...$itemData,
            ]);
        }
    }
}
