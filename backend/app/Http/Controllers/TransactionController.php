<?php

namespace App\Http\Controllers;

use App\Models\BuyRequest;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * Create a new transaction (when seller accepts buy request and buyer selects payment type)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'buy_request_id' => 'required|exists:buy_requests,id',
            'type' => 'required|in:escrow,manual',
        ]);

        $user = $request->user();
        $buyRequest = BuyRequest::with(['buyer', 'seller', 'item'])->findOrFail($data['buy_request_id']);

        // Verify buy request is accepted
        if ($buyRequest->status !== 'accepted') {
            return response()->json([
                'success' => false,
                'message' => 'Buy request must be accepted before creating a transaction',
            ], 422);
        }

        // Verify user is the buyer
        if ($buyRequest->buyer_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the buyer can create a transaction',
            ], 403);
        }

        // Check if transaction already exists
        if ($buyRequest->transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction already exists for this buy request',
            ], 422);
        }

        // For escrow transactions, verify seller has payout details
        if ($data['type'] === 'escrow' && !$buyRequest->seller->bank_name) {
            return response()->json([
                'success' => false,
                'message' => 'Seller must have payout details configured for escrow transactions',
            ], 422);
        }

        DB::transaction(function () use ($user, $buyRequest, $data) {
            $transaction = Transaction::create([
                'buy_request_id' => $buyRequest->id,
                'buyer_id' => $buyRequest->buyer_id,
                'seller_id' => $buyRequest->seller_id,
                'item_id' => $buyRequest->item_id,
                'amount' => $buyRequest->price,
                'type' => $data['type'],
                'status' => $data['type'] === 'escrow' ? 'pending' : 'pending',
            ]);

            // For escrow: mark as funds_held (simulated - in real implementation, this would lock payment)
            if ($data['type'] === 'escrow') {
                $transaction->update([
                    'status' => 'funds_held',
                    'funds_held_at' => now(),
                    'auto_release_at' => now()->addDays(7), // Auto-release after 7 days if no dispute
                ]);
            }
        });

        $transaction = Transaction::where('buy_request_id', $buyRequest->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => [
                'transaction' => $transaction->load(['buyer', 'seller', 'item', 'buyRequest']),
            ],
        ], 201);
    }

    /**
     * Get transactions for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::where(function ($query) use ($user) {
            $query->where('buyer_id', $user->id)
                ->orWhere('seller_id', $user->id);
        })
        ->with(['buyer', 'seller', 'item', 'buyRequest'])
        ->latest()
        ->get();

        $formatted = $transactions->map(function ($transaction) use ($user) {
            $isBuyer = $transaction->buyer_id === $user->id;
            $otherUser = $isBuyer ? $transaction->seller : $transaction->buyer;

            return [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'status' => $transaction->status,
                'amount' => $transaction->amount,
                'item' => [
                    'id' => $transaction->item->id,
                    'title' => $transaction->item->title,
                    'photo' => !empty($transaction->item->photos) ? $transaction->item->photos[0] : null,
                ],
                'other_user' => [
                    'id' => $otherUser->id,
                    'username' => $otherUser->username,
                    'name' => $otherUser->name ?? $otherUser->username,
                    'photo' => $otherUser->profile_photo ?? null,
                ],
                'is_buyer' => $isBuyer,
                'funds_held_at' => $transaction->funds_held_at,
                'delivery_confirmed_at' => $transaction->delivery_confirmed_at,
                'released_at' => $transaction->released_at,
                'completed_at' => $transaction->completed_at,
                'auto_release_at' => $transaction->auto_release_at,
                'created_at' => $transaction->created_at,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'transactions' => $formatted,
        ]);
    }

    /**
     * Get a specific transaction
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::with(['buyer', 'seller', 'item', 'buyRequest'])->findOrFail($id);

        // Verify user is part of the transaction
        if ($transaction->buyer_id !== $user->id && $transaction->seller_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized to view this transaction',
            ], 403);
        }

        $isBuyer = $transaction->buyer_id === $user->id;
        $otherUser = $isBuyer ? $transaction->seller : $transaction->buyer;

        return response()->json([
            'success' => true,
            'data' => [
                'transaction' => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'amount' => $transaction->amount,
                    'item' => [
                        'id' => $transaction->item->id,
                        'title' => $transaction->item->title,
                        'description' => $transaction->item->description,
                        'photos' => $transaction->item->photos,
                    ],
                    'other_user' => [
                        'id' => $otherUser->id,
                        'username' => $otherUser->username,
                        'name' => $otherUser->name ?? $otherUser->username,
                        'photo' => $otherUser->profile_photo ?? null,
                        'city' => $otherUser->city,
                    ],
                    'is_buyer' => $isBuyer,
                    'funds_held_at' => $transaction->funds_held_at,
                    'delivery_confirmed_at' => $transaction->delivery_confirmed_at,
                    'released_at' => $transaction->released_at,
                    'completed_at' => $transaction->completed_at,
                    'auto_release_at' => $transaction->auto_release_at,
                    'created_at' => $transaction->created_at,
                ],
            ],
        ]);
    }

    /**
     * Confirm delivery (buyer confirms item received)
     */
    public function confirmDelivery(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::findOrFail($id);

        // Verify user is the buyer
        if ($transaction->buyer_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the buyer can confirm delivery',
            ], 403);
        }

        // Verify transaction is escrow type and funds are held
        if ($transaction->type !== 'escrow' || $transaction->status !== 'funds_held') {
            return response()->json([
                'success' => false,
                'message' => 'Can only confirm delivery for escrow transactions with held funds',
            ], 422);
        }

        DB::transaction(function () use ($transaction) {
            // Release funds and complete transaction
            $transaction->update([
                'status' => 'completed',
                'delivery_confirmed_at' => now(),
                'released_at' => now(),
                'completed_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Delivery confirmed. Funds have been released to the seller.',
            'data' => [
                'transaction' => $transaction->fresh()->load(['buyer', 'seller', 'item']),
            ],
        ]);
    }

    /**
     * Mark item as delivered (seller marks item as delivered)
     */
    public function markDelivered(Request $request, string $id)
    {
        $user = $request->user();
        $transaction = Transaction::findOrFail($id);

        // Verify user is the seller
        if ($transaction->seller_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the seller can mark item as delivered',
            ], 403);
        }

        // Verify transaction is escrow type and funds are held
        if ($transaction->type !== 'escrow' || $transaction->status !== 'funds_held') {
            return response()->json([
                'success' => false,
                'message' => 'Can only mark delivery for escrow transactions with held funds',
            ], 422);
        }

        $transaction->update([
            'status' => 'awaiting_delivery',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item marked as delivered. Waiting for buyer confirmation.',
            'data' => [
                'transaction' => $transaction->fresh()->load(['buyer', 'seller', 'item']),
            ],
        ]);
    }
}
