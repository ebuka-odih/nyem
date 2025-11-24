<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SwipeController;
use App\Http\Controllers\TradeOfferController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Nyem API']);
});

Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::put('/profile/update', [ProfileController::class, 'update']);
    Route::put('/profile/update-password', [ProfileController::class, 'updatePassword']);


    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items/feed', [ItemController::class, 'feed']);
    Route::get('/items/{item}', [ItemController::class, 'show']);
    Route::put('/items/{item}', [ItemController::class, 'update']);
    Route::delete('/items/{item}', [ItemController::class, 'destroy']);
    // Friendly alias for uploads/posts
    Route::post('/posts', [ItemController::class, 'store']);

    Route::post('/swipes', [SwipeController::class, 'store']);
    Route::get('/swipes/pending-requests', [SwipeController::class, 'pendingRequests']);

    Route::get('/trade-offers/pending', [TradeOfferController::class, 'pending']);
    Route::post('/trade-offers/{id}/respond', [TradeOfferController::class, 'respond']);

    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{match}', [MatchController::class, 'show']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::get('/conversations/{conversation}/matches', [ConversationController::class, 'matches']);

    Route::post('/messages', [MessageController::class, 'store']);

    Route::post('/report', [ModerationController::class, 'report']);
    Route::post('/block', [ModerationController::class, 'block']);
});
