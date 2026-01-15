<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuyRequestController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\GeographicController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MessageRequestController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServiceProviderController;
use App\Http\Controllers\SwipeController;
use App\Http\Controllers\TradeOfferController;
use App\Http\Controllers\TestModelController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\EscrowController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\FollowController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Nyem API']);
});

// Public endpoints for categories
Route::get('/categories', [CategoryController::class, 'index']);

// Public endpoints for geographic reference data (cities, areas)
Route::get('/locations', [GeographicController::class, 'locations']); // Backward compatibility - returns cities
Route::get('/locations/cities', [GeographicController::class, 'cities']);
Route::get('/locations/cities/{cityId}/areas', [GeographicController::class, 'areas']);
Route::get('/locations/areas', [GeographicController::class, 'areas']); // Alternative: ?city_id=123

// Public feed endpoints - work with or without authentication
Route::get('/listings/feed', [ListingController::class, 'feed']);
Route::get('/items/feed', [ListingController::class, 'feed']); // Backward compatibility alias
Route::get('/service-providers/feed', [ServiceProviderController::class, 'feed']);

// Public endpoints for tracking listing stats (works with or without authentication)
Route::post('/listings/{listing}/view', [ListingController::class, 'trackView']);
Route::post('/listings/{listing}/share', [ListingController::class, 'trackShare']);
Route::post('/items/{listing}/view', [ListingController::class, 'trackView']); // Backward compatibility alias
Route::post('/items/{listing}/share', [ListingController::class, 'trackShare']); // Backward compatibility alias

Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/send-email-otp', [AuthController::class, 'sendEmailOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    // Google OAuth routes
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']); // Initiate OAuth flow
    Route::get('/google/callback', [AuthController::class, 'googleCallback']); // Handle callback from Google
    Route::post('/google', [AuthController::class, 'googleAuth']); // Direct token authentication (popup flow)
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});



Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::put('/profile/update', [ProfileController::class, 'update']);
    Route::put('/profile/update-password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/onesignal-player-id', [ProfileController::class, 'updateOneSignalPlayerId']);
    
    // Notification settings
    Route::get('/profile/notifications', [ProfileController::class, 'getNotificationSettings']);
    Route::put('/profile/notifications', [ProfileController::class, 'updateNotificationSettings']);
    
    // Payment and escrow settings
    Route::get('/profile/payments', [ProfileController::class, 'getPaymentSettings']);
    Route::put('/profile/payments', [ProfileController::class, 'updatePaymentSettings']);
    Route::get('/profile/banks', [ProfileController::class, 'getBanks']);
    Route::post('/profile/verify-bank', [ProfileController::class, 'verifyBankAccount']);
    
    // Security settings
    Route::get('/profile/security', [ProfileController::class, 'getSecuritySettings']);
    
    // Trade history
    Route::get('/profile/trade-history', [ProfileController::class, 'getTradeHistory']);

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

    // Review endpoints
    Route::post('/reviews', [ReviewController::class, 'store']);

    Route::post('/listings', [ListingController::class, 'store']);
    Route::get('/listings/{listing}', [ListingController::class, 'show']);
    Route::put('/listings/{listing}', [ListingController::class, 'update']);
    Route::delete('/listings/{listing}', [ListingController::class, 'destroy']);
    // Backward compatibility aliases
    Route::post('/items', [ListingController::class, 'store']);
    Route::get('/items/{listing}', [ListingController::class, 'show']);
    Route::put('/items/{listing}', [ListingController::class, 'update']);
    Route::delete('/items/{listing}', [ListingController::class, 'destroy']);
    // Friendly alias for uploads/posts
    Route::post('/posts', [ListingController::class, 'store']);

    Route::post('/swipes', [SwipeController::class, 'store']);
    Route::get('/swipes/pending-requests', [SwipeController::class, 'pendingRequests']);
    Route::get('/swipes/wishlist', [SwipeController::class, 'wishlist']);

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
    Route::post('/conversations/{conversation}/toggle-escrow', [ConversationController::class, 'toggleEscrow']);

    Route::post('/messages', [MessageController::class, 'store']);

    Route::post('/report', [ModerationController::class, 'report']);
    Route::post('/block', [ModerationController::class, 'block']);

    // Follower routes
    Route::post('/users/{user}/follow', [FollowController::class, 'follow']);
    Route::post('/users/{user}/unfollow', [FollowController::class, 'unfollow']);
    Route::get('/users/{user}/follow-status', [FollowController::class, 'check']);

    // Service provider endpoints
    Route::post('/service-providers', [ServiceProviderController::class, 'store']);
    Route::get('/service-providers/me', [ServiceProviderController::class, 'me']);

    // Phone verification for sellers (marketplace)
    Route::post('/auth/verify-phone-for-seller', [AuthController::class, 'verifyPhoneForSeller']);

    // Test Model endpoints (for testing Laravel Boost MCP)
    Route::apiResource('test-models', TestModelController::class);

    // Notification endpoints
    Route::prefix('notifications')->group(function () {
        Route::post('/test', [NotificationController::class, 'sendTestNotification']);
        Route::post('/test/me', [NotificationController::class, 'sendToMe']);
    });

    // Escrow endpoints
    Route::post('/escrows', [EscrowController::class, 'store']);
    Route::post('/escrows/{escrow}/verify-payment', [EscrowController::class, 'verifyPayment']);
    Route::post('/escrows/{escrow}/acknowledge', [EscrowController::class, 'acknowledge']);
    Route::post('/escrows/{escrow}/complete', [EscrowController::class, 'complete']);
    Route::post('/escrows/{escrow}/confirm', [EscrowController::class, 'confirm']);
    Route::post('/escrows/{escrow}/dispute', [EscrowController::class, 'dispute']);
});

// These public profile routes must be outside and after the auth group to avoid collisions
Route::prefix('profile')->group(function () {
    Route::post('/check-username', [ProfileController::class, 'checkUsername']);
    Route::get('/{id}', [ProfileController::class, 'show']);
});

Route::get('/users/{user}/reviews', [ReviewController::class, 'index']);

