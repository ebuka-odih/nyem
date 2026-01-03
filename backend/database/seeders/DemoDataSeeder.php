<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class DemoDataSeeder extends Seeder
{
    /**
     * Helper function to find category ID by name
     */
    private function getCategoryId(string $categoryName): ?int
    {
        $category = Category::where('name', $categoryName)->first();
        return $category?->id;
    }

    public function run(): void
    {
        $faker = Faker::create();
        
        $user = User::firstOrCreate(
            ['phone' => '08000000000'],
            [
                'username' => 'john_doe',
                'city' => 'Lagos',
                'password' => Hash::make('password'),
                'otp_verified_at' => now(),
                'role' => 'standard_user',
                'bio' => 'I love swapping cool gadgets.',
                'profile_photo' => 'https://ui-avatars.com/api/?name=' . urlencode('Demo User') . '&background=random',
            ],
        );

        // Delete existing items for demo user to replace with real items
        Item::where('user_id', $user->id)->delete();

        // Create 5 real items for the demo user
        $items = [
            [
                'title' => 'Phone',
                'description' => 'Samsung Galaxy S21, 128GB. Excellent condition with screen protector.',
                'category_name' => 'Phones', // Map to Swap > Phones
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
                'looking_for' => 'Laptop or tablet',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Laptop',
                'description' => 'HP Pavilion 15, Intel i5, 8GB RAM, 256GB SSD. Good for work and study.',
                'category_name' => 'Laptops', // Map to Swap > Laptops
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
                'looking_for' => 'Phone or camera',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Dress',
                'description' => 'Elegant blue evening dress, size M. Perfect for parties and events.',
                'category_name' => 'Fashion (Women)', // Map to Shop > Fashion (Women)
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
                'looking_for' => 'Shoes or handbag',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Blender',
                'description' => 'Powerful kitchen blender, great for smoothies and juices. Works perfectly.',
                'category_name' => 'Kitchenware', // Map to Shop > Kitchenware
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'],
                'looking_for' => 'Microwave or toaster',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Plant bucket',
                'description' => 'Large decorative plant bucket, perfect for indoor plants. Modern design.',
                'category_name' => 'Furniture & Home Decor', // Map to Shop > Furniture & Home Decor
                'condition' => 'new',
                'photos' => ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'],
                'looking_for' => 'Garden tools or pots',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
        ];

        foreach ($items as $itemData) {
            $categoryName = $itemData['category_name'];
            unset($itemData['category_name']);
            
            $categoryId = $this->getCategoryId($categoryName);
            if (!$categoryId) {
                // Fallback to first available category if not found
                $categoryId = Category::first()?->id ?? 1;
            }
            
            Item::create([
                'user_id' => $user->id,
                'category_id' => $categoryId,
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
                'profile_photo' => 'https://ui-avatars.com/api/?name=' . urlencode('Tester User') . '&background=random',
            ],
        );

        // Delete existing items for tester user to replace with real items
        Item::where('user_id', $testerUser->id)->delete();

        // Create 4 real items for the tester user
        $testerItems = [
            [
                'title' => 'Watch',
                'description' => 'Classic leather strap watch, perfect for daily wear. Good condition.',
                'category_name' => 'Bags & Accessories', // Map to Swap > Bags & Accessories
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
                'looking_for' => 'Sunglasses or wallet',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Headphones',
                'description' => 'Wireless Bluetooth headphones with noise cancellation. Great sound quality.',
                'category_name' => 'Electronics & Gadgets', // Map to Shop > Electronics & Gadgets
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
                'looking_for' => 'Speaker or earbuds',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Shoes',
                'description' => 'Nike running shoes, size 42. Comfortable and durable for workouts.',
                'category_name' => 'Shoes', // Map to Swap > Shoes
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
                'looking_for' => 'Sneakers or sports gear',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
            [
                'title' => 'Camera',
                'description' => 'Canon DSLR camera with lens. Perfect for photography enthusiasts.',
                'category_name' => 'Electronics', // Map to Swap > Electronics
                'condition' => 'used',
                'photos' => ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
                'looking_for' => 'Laptop or tablet',
                'city' => 'Abuja',
                'status' => 'active',
                'type' => 'barter',
            ],
        ];

        foreach ($testerItems as $itemData) {
            $categoryName = $itemData['category_name'];
            unset($itemData['category_name']);
            
            $categoryId = $this->getCategoryId($categoryName);
            if (!$categoryId) {
                // Fallback to first available category if not found
                $categoryId = Category::first()?->id ?? 1;
            }
            
            Item::create([
                'user_id' => $testerUser->id,
                'category_id' => $categoryId,
                ...$itemData,
            ]);
        }

        // Create 5 marketplace items for testing (Shop category)
        $marketplaceItems = [
            [
                'title' => 'iPhone 13 Pro',
                'description' => '128GB, Space Gray. Excellent condition, comes with original box and charger. Screen protector applied.',
                'category_name' => 'Phones & Gadgets', // Shop > Phones & Gadgets
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'],
                'price' => 450000.00,
                'city' => 'Lagos',
                'status' => 'active',
                'type' => 'marketplace',
            ],
            [
                'title' => 'Designer Handbag',
                'description' => 'Authentic leather handbag, perfect for everyday use. Spacious compartments, elegant design.',
                'category_name' => 'Shoes & Bags', // Shop > Shoes & Bags
                'condition' => 'new',
                'photos' => ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
                'price' => 85000.00,
                'city' => 'Lagos',
                'status' => 'active',
                'type' => 'marketplace',
            ],
            [
                'title' => 'Smart TV 55 inch',
                'description' => '4K Ultra HD Smart TV with built-in streaming apps. Perfect for home entertainment. Like new condition.',
                'category_name' => 'Home & Lifestyle', // Shop > Home & Lifestyle
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'],
                'price' => 320000.00,
                'city' => 'Lagos',
                'status' => 'active',
                'type' => 'marketplace',
            ],
            [
                'title' => 'Designer Leather Jacket',
                'description' => 'Premium genuine leather jacket, size L. Classic black color, perfect for any occasion. Excellent condition with minimal wear.',
                'category_name' => 'Fashion & Clothing', // Shop > Fashion & Clothing
                'condition' => 'like_new',
                'photos' => ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
                'price' => 125000.00,
                'city' => 'Lagos',
                'status' => 'active',
                'type' => 'marketplace',
            ],
            [
                'title' => 'Premium Perfume Set',
                'description' => 'Luxury fragrance collection - 3 bottles of designer perfumes (100ml each). Includes men\'s and women\'s scents. Brand new, sealed boxes.',
                'category_name' => 'Beauty & Perfume', // Shop > Beauty & Perfume
                'condition' => 'new',
                'photos' => ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'],
                'price' => 95000.00,
                'city' => 'Lagos',
                'status' => 'active',
                'type' => 'marketplace',
            ],
        ];

        foreach ($marketplaceItems as $itemData) {
            $categoryName = $itemData['category_name'];
            unset($itemData['category_name']);
            
            $categoryId = $this->getCategoryId($categoryName);
            if (!$categoryId) {
                // Fallback to first available Shop category if not found
                $shopCategory = Category::where('name', 'Shop')->first();
                $categoryId = $shopCategory?->id ?? 1;
            }
            
            Item::create([
                'user_id' => $user->id,
                'category_id' => $categoryId,
                ...$itemData,
            ]);
        }
    }
}
