<?php

/**
 * Temporary debug route to check user locations
 * Remove this file after debugging
 */

use Illuminate\Support\Facades\Route;
use App\Models\User;

Route::get('/debug/locations', function () {
    $users = User::whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->select('id', 'username', 'latitude', 'longitude', 'location_updated_at')
        ->get();

    return response()->json([
        'total_users_with_location' => $users->count(),
        'users' => $users,
    ]);
})->middleware('auth:sanctum');

