<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreListingRequest;
use App\Http\Requests\UpdateListingRequest;
use App\Http\Resources\ListingCollection;
use App\Http\Resources\ListingResource;
use App\Models\Listing;
use App\Services\ListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function __construct(
        protected ListingService $listingService
    ) {}

    /**
     * Store a newly created listing
     */
    public function store(StoreListingRequest $request): JsonResponse
    {
        try {
            $listing = $this->listingService->createListing(
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'listing' => new ListingResource($listing),
                'item' => new ListingResource($listing), // Backward compatibility
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            $code = $e->getCode() && $e->getCode() >= 400 && $e->getCode() < 600 
                ? $e->getCode() 
                : 403;
            
            return response()->json([
                'message' => $e->getMessage(),
                'requires_phone_verification' => $code === 403,
                'listings_count' => $request->user()->listings()->count(),
                'free_limit' => 2,
            ], $code);
        }
    }

    /**
     * @return mixed
     */
    public function feed(Request $request)
    {
        try {
            $user = $request->user(); // Can be null if not authenticated
            $blockedIds = $user ? $this->blockedUserIds($user) : [];

            // Extract filters from request
            $filters = [
                'include_own' => $request->boolean('include_own', true),
                'ignore_city' => $request->boolean('ignore_city', false),
                'city' => $request->filled('city') ? $request->string('city')->toString() : null,
                'category' => $request->filled('category') ? $request->string('category')->toString() : null,
                'type' => $request->filled('type') ? $request->string('type')->toString() : null,
            ];

            $listings = $this->listingService->getFeedListings($filters, $user, $blockedIds);

            return new ListingCollection($listings);
        } catch (\Exception $e) {
            \Log::error('Feed failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Display the specified listing
     */
    public function show(Request $request, Listing $listing): JsonResponse
    {
        $user = $request->user();
        
        if ($user && $this->isBlockedBetween($user, $listing->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        $listing->load(['user.cityLocation', 'user.areaLocation']);
        
        // Calculate and attach distance if user has location
        $this->listingService->attachDistance($listing, $user);

        return response()->json([
            'listing' => new ListingResource($listing),
            'item' => new ListingResource($listing), // Backward compatibility
        ]);
    }

    /**
     * Track a view for a listing
     * Works for both authenticated and unauthenticated users
     * Prevents duplicate views from the same user/IP within 24 hours
     */
    public function trackView(Request $request, Listing $listing): JsonResponse
    {
        $result = $this->listingService->trackView(
            $listing,
            $request->user(),
            $request->ip(),
            $request->userAgent() ?? ''
        );

        return response()->json($result, $result['newly_created'] ? 201 : 200);
    }

    /**
     * Track a share for a listing
     * Works for both authenticated and unauthenticated users
     */
    public function trackShare(Request $request, Listing $listing): JsonResponse
    {
        $result = $this->listingService->trackShare(
            $listing,
            $request->user(),
            $request->ip(),
            $request->userAgent() ?? ''
        );

        return response()->json($result, $result['newly_created'] ? 201 : 200);
    }

    /**
     * Update the specified listing
     */
    public function update(UpdateListingRequest $request, Listing $listing): JsonResponse
    {
        $this->authorizeListingOwnership($request->user()->id, $listing);

        try {
            $listing = $this->listingService->updateListing(
                $listing,
                $request->validated()
            );

            return response()->json([
                'listing' => new ListingResource($listing),
                'item' => new ListingResource($listing), // Backward compatibility
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Remove the specified listing
     */
    public function destroy(Request $request, Listing $listing): JsonResponse
    {
        $this->authorizeListingOwnership($request->user()->id, $listing);
        $listing->delete();

        return response()->json(['message' => 'Listing deleted']);
    }

    /**
     * Authorize that the user owns the listing
     */
    private function authorizeListingOwnership(string $userId, Listing $listing): void
    {
        if ($listing->user_id !== $userId) {
            abort(403, 'You can only manage your own listings');
        }
    }
}
