<?php

namespace App\Http\Controllers;

use App\Models\BuyRequest;
use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BuyRequestController extends Controller
{
    /**
     * Create a new buy request
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'item_id' => 'sometimes|exists:listings,id', // Backward compatibility alias
        ]);

        $user = $request->user();
        $listingId = $data['listing_id'] ?? $data['item_id'] ?? null;
        $listing = Listing::findOrFail($listingId);

        // Verify listing is a marketplace listing
        if ($listing->type !== Listing::TYPE_MARKETPLACE) {
            return response()->json([
                'success' => false,
                'message' => 'Buy requests are only available for marketplace listings',
            ], 422);
        }

        // Verify user is not the seller
        if ($listing->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot send a buy request for your own listing',
            ], 422);
        }

        // Check if users are blocked
        if ($this->isBlockedBetween($user, $listing->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'User blocked',
            ], 403);
        }

        // Get buyer's location (from user's city)
        $location = $user->city ?? null;

        // Create or update buy request (ensures one request per buyer-seller-listing)
        $buyRequest = BuyRequest::updateOrCreate(
            [
                'buyer_id' => $user->id,
                'seller_id' => $listing->user_id,
                'listing_id' => $listing->id,
            ],
            [
                'price' => $listing->price,
                'location' => $location,
                'status' => 'pending',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Buy request sent successfully',
            'data' => [
                'buy_request' => $buyRequest->load(['buyer', 'listing']),
            ],
        ], 201);
    }

    /**
     * Get all pending buy requests for the authenticated user (seller)
     */
    public function pending(Request $request)
    {
        $user = $request->user();

        // Get all pending buy requests where current user is the seller
        $buyRequests = BuyRequest::where('seller_id', $user->id)
            ->where('status', 'pending')
            ->with(['buyer', 'listing'])
            ->latest()
            ->get();

        // Filter out requests from blocked users
        $blockedUserIds = $this->blockedUserIds($user);

        $filteredRequests = $buyRequests->filter(function ($buyRequest) use ($blockedUserIds) {
            return !in_array($buyRequest->buyer_id, $blockedUserIds);
        })->map(function ($buyRequest) {
            return [
                'id' => $buyRequest->id,
                'buyer' => [
                    'id' => $buyRequest->buyer->id,
                    'username' => $buyRequest->buyer->username,
                    'name' => $buyRequest->buyer->name ?? $buyRequest->buyer->username,
                    'photo' => $buyRequest->buyer->profile_photo ?? null,
                    'city' => $buyRequest->buyer->city,
                ],
                'listing' => [
                    'id' => $buyRequest->listing->id,
                    'title' => $buyRequest->listing->title,
                    'photo' => !empty($buyRequest->listing->photos) ? $buyRequest->listing->photos[0] : null,
                ],
                'item' => [ // Backward compatibility
                    'id' => $buyRequest->listing->id,
                    'title' => $buyRequest->listing->title,
                    'photo' => !empty($buyRequest->listing->photos) ? $buyRequest->listing->photos[0] : null,
                ],
                'price' => $buyRequest->price,
                'location' => $buyRequest->location,
                'status' => $buyRequest->status,
                'created_at' => $buyRequest->created_at,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'requests' => $filteredRequests,
        ]);
    }

    /**
     * Respond to a buy request (accept or decline)
     */
    public function respond(Request $request, string $id)
    {
        $data = $request->validate([
            'decision' => 'required|in:accept,decline',
        ]);

        $user = $request->user();
        $buyRequest = BuyRequest::with(['buyer', 'listing'])->findOrFail($id);

        // Verify the request is for the current user (seller)
        if ($buyRequest->seller_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized for this request',
            ], 403);
        }

        // Verify request is still pending
        if ($buyRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Request is no longer pending',
            ], 422);
        }

        // Check if users are blocked
        if ($this->isBlockedBetween($user, $buyRequest->buyer_id)) {
            return response()->json([
                'success' => false,
                'message' => 'User blocked',
            ], 403);
        }

        DB::transaction(function () use ($buyRequest, $data) {
            if ($data['decision'] === 'accept') {
                // Accept the request
                $buyRequest->update(['status' => 'accepted']);
            } else {
                // Decline the request
                $buyRequest->update(['status' => 'declined']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => $data['decision'] === 'accept' ? 'Buy request accepted' : 'Buy request declined',
            'data' => [
                'buy_request' => $buyRequest->fresh()->load(['buyer', 'listing']),
                'needs_payout_setup' => $data['decision'] === 'accept' && !$user->bank_name,
            ],
        ]);
    }

    /**
     * Get buy requests sent by the authenticated user (buyer)
     */
    public function sent(Request $request)
    {
        $user = $request->user();

        $buyRequests = BuyRequest::where('buyer_id', $user->id)
            ->with(['seller', 'listing'])
            ->latest()
            ->get();

        $requests = $buyRequests->map(function ($buyRequest) {
            return [
                'id' => $buyRequest->id,
                'seller' => [
                    'id' => $buyRequest->seller->id,
                    'username' => $buyRequest->seller->username,
                    'name' => $buyRequest->seller->name ?? $buyRequest->seller->username,
                    'photo' => $buyRequest->seller->profile_photo ?? null,
                ],
                'listing' => [
                    'id' => $buyRequest->listing->id,
                    'title' => $buyRequest->listing->title,
                    'photo' => !empty($buyRequest->listing->photos) ? $buyRequest->listing->photos[0] : null,
                ],
                'item' => [ // Backward compatibility
                    'id' => $buyRequest->listing->id,
                    'title' => $buyRequest->listing->title,
                    'photo' => !empty($buyRequest->listing->photos) ? $buyRequest->listing->photos[0] : null,
                ],
                'price' => $buyRequest->price,
                'status' => $buyRequest->status,
                'created_at' => $buyRequest->created_at,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'requests' => $requests,
        ]);
    }
}
