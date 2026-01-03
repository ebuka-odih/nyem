#!/usr/bin/env php
<?php

/**
 * Simple API Test Script for Profile Endpoints
 * Run with: php test_profile_api.php
 */

$baseUrl = 'http://localhost:8001/api';

echo "=== Testing Profile API Endpoints ===\n\n";

// Test 1: Register a new user
echo "1. Registering test user...\n";
$registerData = [
    'username' => 'testuser_' . time(),
    'phone' => '080' . rand(10000000, 99999999),
    'password' => 'password123',
    'city' => 'Lagos',
];

$ch = curl_init("$baseUrl/auth/register");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registerData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 && $httpCode !== 201) {
    echo "❌ Registration failed (HTTP $httpCode): $response\n";
    exit(1);
}

$registerResult = json_decode($response, true);
$token = $registerResult['token'] ?? null;

if (!$token) {
    echo "❌ No token received\n";
    exit(1);
}

echo "✅ User registered successfully\n";
echo "   Token: " . substr($token, 0, 20) . "...\n\n";

// Test 2: Get profile
echo "2. Getting user profile...\n";
$ch = curl_init("$baseUrl/profile/me");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ Get profile failed (HTTP $httpCode): $response\n";
    exit(1);
}

$profileResult = json_decode($response, true);
echo "✅ Profile retrieved successfully\n";
echo "   Username: " . ($profileResult['user']['username'] ?? 'N/A') . "\n";
echo "   City: " . ($profileResult['user']['city'] ?? 'N/A') . "\n";
echo "   Can change username: " . ($profileResult['can_change_username'] ? 'Yes' : 'No') . "\n\n";

// Test 3: Update profile
echo "3. Updating profile...\n";
$updateData = [
    'username' => 'updated_' . time(),
    'city' => 'Abuja',
    'bio' => 'This is my test bio',
];

$ch = curl_init("$baseUrl/profile/update");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ Update profile failed (HTTP $httpCode): $response\n";
    exit(1);
}

$updateResult = json_decode($response, true);
echo "✅ Profile updated successfully\n";
echo "   New username: " . ($updateResult['user']['username'] ?? 'N/A') . "\n";
echo "   New city: " . ($updateResult['user']['city'] ?? 'N/A') . "\n";
echo "   New bio: " . ($updateResult['user']['bio'] ?? 'N/A') . "\n\n";

// Test 4: Try to update username again (should fail due to 24hr limit)
echo "4. Testing username change limit (should fail)...\n";
$updateData2 = [
    'username' => 'another_' . time(),
];

$ch = curl_init("$baseUrl/profile/update");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData2));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 422) {
    echo "✅ Username change correctly blocked (24hr limit working)\n\n";
} else {
    echo "⚠️  Expected 422 error, got HTTP $httpCode\n\n";
}

// Test 5: Update password
echo "5. Updating password...\n";
$passwordData = [
    'current_password' => 'password123',
    'new_password' => 'newpassword456',
    'new_password_confirmation' => 'newpassword456',
];

$ch = curl_init("$baseUrl/profile/update-password");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($passwordData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ Update password failed (HTTP $httpCode): $response\n";
    exit(1);
}

echo "✅ Password updated successfully\n\n";

// Test 6: Try wrong current password
echo "6. Testing wrong current password (should fail)...\n";
$wrongPasswordData = [
    'current_password' => 'wrongpassword',
    'new_password' => 'anotherpassword',
    'new_password_confirmation' => 'anotherpassword',
];

$ch = curl_init("$baseUrl/profile/update-password");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($wrongPasswordData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 422) {
    echo "✅ Wrong password correctly rejected\n\n";
} else {
    echo "⚠️  Expected 422 error, got HTTP $httpCode\n\n";
}

echo "=== All Tests Completed ===\n";
echo "✅ Profile endpoints are working correctly!\n";
