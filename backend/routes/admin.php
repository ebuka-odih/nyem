<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminItemController;
use App\Http\Controllers\Admin\AdminMatchController;
use App\Http\Controllers\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| These routes are for admin users only. All routes require authentication
| and admin role verification.
|
*/

Route::middleware(['auth', 'admin'])->prefix('api/admin')->group(function () {
    // Dashboard stats (API endpoint, kept for backward compatibility)
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // User management (API endpoints for Inertia forms)
    Route::apiResource('users', AdminUserController::class);

    // Match management (API endpoints for Inertia forms)
    Route::apiResource('matches', AdminMatchController::class);

    // Item management (API endpoints for Inertia forms)
    Route::apiResource('items', AdminItemController::class);
});

