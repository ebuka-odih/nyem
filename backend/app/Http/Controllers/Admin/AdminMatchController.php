<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMatchController extends Controller
{
    /**
     * Get all matches with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');

        $query = UserMatch::with(['user1', 'user2', 'item1', 'item2', 'conversation']);

        // Search by username
        if ($search) {
            $query->whereHas('user1', function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%");
            })->orWhereHas('user2', function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%");
            });
        }

        $matches = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $matches,
        ]);
    }

    /**
     * Get a specific match with details
     */
    public function show(string $id): JsonResponse
    {
        $match = UserMatch::with([
            'user1',
            'user2',
            'item1',
            'item2',
            'conversation.messages' => function ($query) {
                $query->latest()->limit(10);
            },
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $match,
        ]);
    }

    /**
     * Delete a match
     */
    public function destroy(string $id): JsonResponse
    {
        $match = UserMatch::findOrFail($id);
        $match->delete();

        return response()->json([
            'success' => true,
            'message' => 'Match deleted successfully',
        ]);
    }
}

