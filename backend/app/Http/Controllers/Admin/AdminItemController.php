<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminItemController extends Controller
{
    /**
     * Get all items with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $status = $request->get('status');
        $category = $request->get('category');

        $query = Item::with('user');

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

        // Filter by category
        if ($category) {
            $query->where('category', $category);
        }

        $items = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get a specific item with details
     */
    public function show(string $id): JsonResponse
    {
        $item = Item::with(['user', 'swipes'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Update item status
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = Item::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|string|in:active,inactive,sold',
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item,
        ]);
    }

    /**
     * Delete an item
     */
    public function destroy(string $id): JsonResponse
    {
        $item = Item::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully',
        ]);
    }
}

