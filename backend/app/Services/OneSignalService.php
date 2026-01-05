<?php

namespace App\Services;

use App\Models\User;
use App\Models\Listing;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OneSignalService
{
    private $appId;
    private $restApiKey;

    public function __construct()
    {
        $this->appId = config('services.onesignal.app_id', '401c6128-33c4-47ba-af30-337413de42bb');
        $this->restApiKey = config('services.onesignal.rest_api_key', env('ONESIGNAL_REST_API_KEY'));
    }

    /**
     * Send push notification to a specific user
     */
    public function sendNotificationToUser(User $user, string $title, string $message, array $data = [], string $url = null)
    {
        if (!$user->onesignal_player_id) {
            Log::warning("User {$user->id} does not have OneSignal player ID");
            return false;
        }

        if (!$this->restApiKey) {
            Log::error('OneSignal REST API Key is not configured');
            return false;
        }

        $payload = [
            'app_id' => $this->appId,
            'include_player_ids' => [$user->onesignal_player_id],
            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
            'data' => $data,
        ];

        // Add URL if provided (for deep linking back to app)
        if ($url) {
            $payload['url'] = $url;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $this->restApiKey,
                'Content-Type' => 'application/json',
            ])->post('https://onesignal.com/api/v1/notifications', $payload);

            if ($response->successful()) {
                Log::info('OneSignal notification sent successfully', [
                    'user_id' => $user->id,
                    'title' => $title,
                ]);
                return true;
            } else {
                Log::error('OneSignal notification failed', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('OneSignal notification exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send notification to seller when their item is starred
     */
    public function sendStarNotification(User $seller, Listing $listing, User $buyer)
    {
        $title = "⭐ New Interest in Your Item!";
        $message = "Someone starred your item: " . ($listing->title ?? 'Item');
        
        // Deep link to the app - adjust URL based on your app structure
        $url = config('app.frontend_url', 'https://nyem.app') . '/matches';
        
        $data = [
            'type' => 'item_starred',
            'listing_id' => $listing->id,
            'buyer_id' => $buyer->id,
            'buyer_name' => $buyer->name ?? $buyer->username,
        ];

        return $this->sendNotificationToUser($seller, $title, $message, $data, $url);
    }
}

