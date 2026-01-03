<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserMatch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminMatchesController extends Controller
{
    /**
     * Display the admin matches page
     */
    public function index(Request $request): Response
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
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Matches', [
            'matches' => $matches,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}















