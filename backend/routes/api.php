<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryLocationController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MessageRequestController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SwipeController;
use App\Http\Controllers\TradeOfferController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Nyem API']);
});

// Public endpoints for categories and locations
Route::get('/categories', [CategoryLocationController::class, 'categories']);
Route::get('/locations', [CategoryLocationController::class, 'locations']); // Backward compatibility - returns cities
Route::get('/locations/cities', [CategoryLocationController::class, 'cities']);
Route::get('/locations/cities/{cityId}/areas', [CategoryLocationController::class, 'areas']);
Route::get('/locations/areas', [CategoryLocationController::class, 'areas']); // Alternative: ?city_id=123

// Public endpoint for username availability check
Route::post('/profile/check-username', [ProfileController::class, 'checkUsername']);

// Public feed endpoint - works with or without authentication
Route::get('/items/feed', [ItemController::class, 'feed']);

Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/send-email-otp', [AuthController::class, 'sendEmailOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/google', [AuthController::class, 'googleAuth']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});



Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::put('/profile/update', [ProfileController::class, 'update']);
    Route::put('/profile/update-password', [ProfileController::class, 'updatePassword']);

    // Location endpoints
    // Rate limiting is handled within the controller
    Route::prefix('location')->group(function () {
        Route::post('/update', [LocationController::class, 'update']);
        Route::get('/nearby', [LocationController::class, 'nearby']);
        Route::get('/status', [LocationController::class, 'status']);
    });

    // Image upload endpoints
    Route::post('/images/upload', [ImageUploadController::class, 'upload']);
    Route::post('/images/upload-multiple', [ImageUploadController::class, 'uploadMultiple']);
    Route::post('/images/upload-base64', [ImageUploadController::class, 'uploadBase64']);
    Route::post('/images/upload-multiple-base64', [ImageUploadController::class, 'uploadMultipleBase64']);

    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items/{item}', [ItemController::class, 'show']);
    Route::put('/items/{item}', [ItemController::class, 'update']);
    Route::delete('/items/{item}', [ItemController::class, 'destroy']);
    // Friendly alias for uploads/posts
    Route::post('/posts', [ItemController::class, 'store']);

    Route::post('/swipes', [SwipeController::class, 'store']);
    Route::get('/swipes/pending-requests', [SwipeController::class, 'pendingRequests']);

    Route::get('/trade-offers/pending', [TradeOfferController::class, 'pending']);
    Route::post('/trade-offers/{id}/respond', [TradeOfferController::class, 'respond']);

    Route::get('/message-requests/pending', [MessageRequestController::class, 'pending']);
    Route::post('/message-requests/{id}/respond', [MessageRequestController::class, 'respond']);

    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{match}', [MatchController::class, 'show']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations/start', [ConversationController::class, 'start']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::get('/conversations/{conversation}/matches', [ConversationController::class, 'matches']);

    Route::post('/messages', [MessageController::class, 'store']);

    Route::post('/report', [ModerationController::class, 'report']);
    Route::post('/block', [ModerationController::class, 'block']);

    // Phone verification for sellers (marketplace)
    Route::post('/auth/verify-phone-for-seller', [AuthController::class, 'verifyPhoneForSeller']);
});
