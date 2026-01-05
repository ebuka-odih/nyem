<?php

/**
 * Test script to diagnose Category API issues
 * 
 * This script tests:
 * 1. What categories exist in the database for Shop
 * 2. What the API returns when querying ?parent=Shop
 * 3. Comparison with what the seeder expects
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Category;

echo "=== CATEGORY API DIAGNOSTIC ===\n\n";

// 1. Check Shop main category
echo "1. SHOP MAIN CATEGORY:\n";
$shopMain = Category::where('name', 'Shop')->where('type', 'main')->first();
if ($shopMain) {
    echo "   ✓ Found Shop category (ID: {$shopMain->id})\n";
} else {
    echo "   ✗ Shop category NOT FOUND!\n";
    exit(1);
}

// 2. Check all Shop sub-categories in database
echo "\n2. SHOP SUB-CATEGORIES IN DATABASE:\n";
$shopSubs = Category::where('parent_id', $shopMain->id)
    ->where('type', 'sub')
    ->orderBy('order')
    ->get(['id', 'name', 'order']);

echo "   Total count: " . $shopSubs->count() . "\n";
foreach ($shopSubs as $cat) {
    echo "   - [ID: {$cat->id}] {$cat->name} (order: {$cat->order})\n";
}

// 3. What the seeder expects
echo "\n3. CATEGORIES EXPECTED BY SEEDER:\n";
$expectedCategories = [
    'Electronics',
    'Accessories',
    'Fashion & Clothing',
    'Wigs & Hair',
    'Beauty & Care',
    'Phones & Gadgets',
    'Shoes & Bags',
    'Baby & Kids',
    'Food & Groceries',
    'Garden & Outdoor',
    'Household',
    'Books & Media',
    'Sports',
];

echo "   Expected count: " . count($expectedCategories) . "\n";
foreach ($expectedCategories as $index => $name) {
    $exists = $shopSubs->contains('name', $name);
    $status = $exists ? '✓' : '✗';
    echo "   {$status} " . ($index + 1) . ". {$name}\n";
}

// 4. Missing categories
echo "\n4. MISSING CATEGORIES:\n";
$dbNames = $shopSubs->pluck('name')->toArray();
$missing = array_diff($expectedCategories, $dbNames);
if (empty($missing)) {
    echo "   ✓ All categories present\n";
} else {
    foreach ($missing as $name) {
        echo "   ✗ {$name}\n";
    }
}

// 5. Extra categories (in DB but not in seeder)
echo "\n5. EXTRA CATEGORIES (in DB but not in seeder):\n";
$extra = array_diff($dbNames, $expectedCategories);
if (empty($extra)) {
    echo "   ✓ No extra categories\n";
} else {
    foreach ($extra as $name) {
        echo "   ⚠ {$name}\n";
    }
}

// 6. Test API response
echo "\n6. API RESPONSE SIMULATION:\n";
$request = new \Illuminate\Http\Request(['parent' => 'Shop']);
$controller = new \App\Http\Controllers\CategoryController();
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "   API returned " . count($data['categories']) . " categories\n";
foreach ($data['categories'] as $cat) {
    echo "   - [ID: {$cat['id']}] {$cat['name']} (order: {$cat['order']})\n";
}

// 7. SQL Query that would be executed
echo "\n7. SQL QUERY THAT WOULD BE EXECUTED:\n";
$query = Category::where('parent_id', $shopMain->id)
    ->where('type', 'sub')
    ->orderBy('order');
echo "   " . $query->toSql() . "\n";
echo "   Bindings: " . json_encode($query->getBindings()) . "\n";

echo "\n=== END DIAGNOSTIC ===\n";

