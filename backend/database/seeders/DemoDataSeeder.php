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

        // Create items for tester user
        $testerUser = User::firstOrCreate(
            ['phone' => '08000000001'],
            [
                'username' => 'tester',
                'city' => 'Abuja',
                'password' => Hash::make('password'),
                'otp_verified_at' => now(),
                'role' => 'standard_user',
                'bio' => 'Looking to swap quality items.',
                'profile_photo' => 'https://via.placeholder.com/150',
            ],
        );

        // Delete existing items for tester user to replace with real items
        Item::where('user_id', $testerUser->id)->delete();

        // Create 4 real items for the tester user
        $testerItems = [
            [
                'title' => 'Watch',
                'description' => 'Classic leather strap watch, perfect for daily wear. Good condition.',
                'category' => 'Accessories',
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
                'looking_for' => 'Sunglasses or wallet',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Headphones',
                'description' => 'Wireless Bluetooth headphones with noise cancellation. Great sound quality.',
                'category' => 'Electronics',
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
                'looking_for' => 'Speaker or earbuds',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Shoes',
                'description' => 'Nike running shoes, size 42. Comfortable and durable for workouts.',
                'category' => 'Fashion',
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
                'looking_for' => 'Sneakers or sports gear',
                'city' => 'Abuja',
                'status' => 'active',
            ],
            [
                'title' => 'Camera',
                'description' => 'Canon DSLR camera with lens. Perfect for photography enthusiasts.',
                'category' => 'Electronics',
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
                'looking_for' => 'Laptop or tablet',
                'city' => 'Abuja',
                'status' => 'active',
            ],
        ];

        foreach ($testerItems as $itemData) {
            Item::create([
                'user_id' => $testerUser->id,
                ...$itemData,
            ]);
        }
    }
}
