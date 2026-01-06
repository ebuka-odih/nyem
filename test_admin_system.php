<?php

/**
 * Admin System Test Script
 * 
 * This script helps verify the admin system is properly set up.
 * Run this from the backend directory: php ../test_admin_system.php
 */

require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Admin System Verification ===\n\n";

// Check middleware exists
echo "1. Checking middleware...\n";
if (file_exists(__DIR__ . '/backend/app/Http/Middleware/EnsureUserIsAdmin.php')) {
    echo "   ✓ EnsureUserIsAdmin middleware exists\n";
} else {
    echo "   ✗ EnsureUserIsAdmin middleware NOT FOUND\n";
}

// Check controllers exist
echo "\n2. Checking controllers...\n";
$controllers = [
    'AdminController',
    'AdminUserController',
    'AdminMatchController',
    'AdminItemController',
];

foreach ($controllers as $controller) {
    $path = __DIR__ . "/backend/app/Http/Controllers/Admin/{$controller}.php";
    if (file_exists($path)) {
        echo "   ✓ {$controller} exists\n";
    } else {
        echo "   ✗ {$controller} NOT FOUND\n";
    }
}

// Check routes file exists
echo "\n3. Checking routes...\n";
if (file_exists(__DIR__ . '/backend/routes/admin.php')) {
    echo "   ✓ admin.php routes file exists\n";
} else {
    echo "   ✗ admin.php routes file NOT FOUND\n";
}

// Check User model has relationships
echo "\n4. Checking User model...\n";
$userModel = file_get_contents(__DIR__ . '/backend/app/Models/User.php');
if (strpos($userModel, 'matchesAsUser1') !== false) {
    echo "   ✓ User model has matchesAsUser1 relationship\n";
} else {
    echo "   ✗ User model missing matchesAsUser1 relationship\n";
}

if (strpos($userModel, 'matchesAsUser2') !== false) {
    echo "   ✓ User model has matchesAsUser2 relationship\n";
} else {
    echo "   ✗ User model missing matchesAsUser2 relationship\n";
}

// Check bootstrap has admin middleware registered
echo "\n5. Checking bootstrap configuration...\n";
$bootstrap = file_get_contents(__DIR__ . '/backend/bootstrap/app.php');
if (strpos($bootstrap, "EnsureUserIsAdmin") !== false) {
    echo "   ✓ Admin middleware registered in bootstrap\n";
} else {
    echo "   ✗ Admin middleware NOT registered in bootstrap\n";
}

if (strpos($bootstrap, "routes/admin.php") !== false) {
    echo "   ✓ Admin routes registered in bootstrap\n";
} else {
    echo "   ✗ Admin routes NOT registered in bootstrap\n";
}

// Check frontend files
echo "\n6. Checking frontend files...\n";
$frontendFiles = [
    'web/src/services/adminApi.ts',
    'web/src/components/admin/AdminLayout.tsx',
    'web/src/screens/admin/AdminDashboard.tsx',
    'web/src/screens/admin/AdminUsers.tsx',
    'web/src/screens/admin/AdminMatches.tsx',
    'web/src/screens/admin/AdminItems.tsx',
];

foreach ($frontendFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "   ✓ " . basename($file) . " exists\n";
    } else {
        echo "   ✗ " . basename($file) . " NOT FOUND\n";
    }
}

// Check App.tsx has admin routes
echo "\n7. Checking App.tsx...\n";
$appTsx = file_get_contents(__DIR__ . '/web/src/App.tsx');
if (strpos($appTsx, 'AdminDashboard') !== false && strpos($appTsx, '/admin') !== false) {
    echo "   ✓ Admin routes registered in App.tsx\n";
} else {
    echo "   ✗ Admin routes NOT registered in App.tsx\n";
}

echo "\n=== Verification Complete ===\n";
echo "\nNext steps:\n";
echo "1. Create an admin user: Set role='admin' in users table\n";
echo "2. Start backend: cd backend && php artisan serve\n";
echo "3. Start frontend: cd web && npm run dev\n";
echo "4. Login as admin and navigate to /admin\n";




























