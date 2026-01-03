<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PayoutController extends Controller
{
    /**
     * Get payout details for the authenticated user
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'account_name' => $user->account_name,
                'has_payout_details' => !empty($user->bank_name) && !empty($user->account_number) && !empty($user->account_name),
            ],
        ]);
    }

    /**
     * Update payout details for the authenticated user
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
        ]);

        $user = $request->user();

        $user->update([
            'bank_name' => $data['bank_name'],
            'account_number' => $data['account_number'],
            'account_name' => $data['account_name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payout details updated successfully',
            'data' => [
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'account_name' => $user->account_name,
            ],
        ]);
    }
}
