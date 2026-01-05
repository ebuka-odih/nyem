<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminMatchesController;
use App\Http\Controllers\Admin\AdminListingsController;
use App\Http\Controllers\Admin\AdminCategoriesController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return redirect()->route('login');
});

// OneSignal notification test page (public for easy testing)
Route::get('/notifications/test', [NotificationController::class, 'showTestPage'])->name('notifications.test');
Route::post('/notifications/test/send', [NotificationController::class, 'sendTestNotificationWeb'])->name('notifications.test.send');

// Admin login routes
Route::get('/login', [AdminAuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AdminAuthController::class, 'login']);
Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
Route::get('/logout', [AdminAuthController::class, 'logout']); // Support GET for direct navigation

// Admin routes (require authentication and admin role)
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/users', [AdminUsersController::class, 'index'])->name('users');
    Route::get('/matches', [AdminMatchesController::class, 'index'])->name('matches');
    Route::get('/listings', [AdminListingsController::class, 'index'])->name('listings');
    Route::get('/items', [AdminListingsController::class, 'index'])->name('items'); // Backward compatibility
    Route::get('/categories', [AdminCategoriesController::class, 'index'])->name('categories');
});
