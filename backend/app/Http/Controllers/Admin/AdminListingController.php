<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminListingController extends Controller
{
    /**
     * Get all listings with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $status = $request->get('status');
        $category = $request->get('category');

        $query = Listing::with(['user', 'category']);

        // Search by title or description
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter by category (accepts category_id or category name)
        if ($category) {
            if (is_numeric($category)) {
                $query->where('category_id', $category);
            } else {
                // Find category by name
                $categoryModel = Category::where('name', $category)->first();
                if ($categoryModel) {
                    $query->where('category_id', $categoryModel->id);
                }
            }
        }

        $listings = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $listings,
        ]);
    }

    /**
     * Get a specific listing with details
     */
    public function show(string $id): JsonResponse
    {
        $listing = Listing::with(['user', 'swipes'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $listing,
        ]);
    }

    /**
     * Update listing status
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $listing = Listing::findOrFail($id);

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(Listing::getStatusOptions())],
        ]);

        $listing->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Listing updated successfully',
            'data' => $listing,
        ]);
    }

    /**
     * Delete a listing
     */
    public function destroy(string $id): JsonResponse
    {
        $listing = Listing::findOrFail($id);
        $listing->delete();

        return response()->json([
            'success' => true,
            'message' => 'Listing deleted successfully',
        ]);
    }
}

