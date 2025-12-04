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

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard stats
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // User management
    Route::apiResource('users', AdminUserController::class);

    // Match management
    Route::apiResource('matches', AdminMatchController::class);

    // Item management
    Route::apiResource('items', AdminItemController::class);
});

