<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Message;
use App\Models\Report;
use App\Models\Swipe;
use App\Models\User;
use App\Models\UserMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $stats = [
            'users' => [
                'total' => User::count(),
                'active' => User::whereNotNull('otp_verified_at')->count(),
                'new_today' => User::whereDate('created_at', today())->count(),
                'new_this_week' => User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            ],
            'matches' => [
                'total' => UserMatch::count(),
                'today' => UserMatch::whereDate('created_at', today())->count(),
                'this_week' => UserMatch::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            ],
            'items' => [
                'total' => Item::count(),
                'active' => Item::where('status', 'active')->count(),
                'today' => Item::whereDate('created_at', today())->count(),
            ],
            'swipes' => [
                'total' => Swipe::count(),
                'today' => Swipe::whereDate('created_at', today())->count(),
            ],
            'messages' => [
                'total' => Message::count(),
                'today' => Message::whereDate('created_at', today())->count(),
            ],
            'reports' => [
                'total' => Report::count(),
                'pending' => Report::count(), // You can add a status field later
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

