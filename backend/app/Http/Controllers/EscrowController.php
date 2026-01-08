<?php

namespace App\Http\Controllers;

use App\Models\Escrow;
use App\Services\EscrowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EscrowController extends Controller
{
    protected $escrowService;

    public function __construct(EscrowService $escrowService)
    {
        $this->escrowService = $escrowService;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'seller_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'description' => 'nullable|string',
        ]);

        $data['buyer_id'] = Auth::id();

        $escrow = $this->escrowService->initiate($data);

        return response()->json($escrow, 201);
    }

    public function verifyPayment(Request $request, Escrow $escrow)
    {
        // Ensure the auth user is the buyer
        if ($escrow->buyer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'reference' => 'required|string'
        ]);

        try {
            $escrow = $this->escrowService->handlePaymentSuccess($escrow, $request->reference);
            
            // Trigger Step 3: Notify Seller (could be an event, but calling directly for now/simplicity)
            $this->escrowService->notifySeller($escrow);
            
            return response()->json($escrow);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function acknowledge(Escrow $escrow)
    {
        if ($escrow->seller_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $escrow = $this->escrowService->acknowledgeService($escrow);
            return response()->json($escrow);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function complete(Request $request, Escrow $escrow)
    {
        if ($escrow->seller_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'completion_note' => 'nullable|string'
        ]);

        try {
            $escrow = $this->escrowService->completeService($escrow, $request->completion_note);
            return response()->json($escrow);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function confirm(Escrow $escrow)
    {
        if ($escrow->buyer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $escrow = $this->escrowService->confirmDelivery($escrow);
            
            // Step 7: System authorizes release automatically upon confirmation (per happy path logic often)
            // Or maybe it waits for admin? 
            // "Step 7: actor: nyem, action: authorizes_fund_release"
            // If automated, we call it here.
            $escrow = $this->escrowService->releaseFunds($escrow);
            
            return response()->json($escrow);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function dispute(Request $request, Escrow $escrow)
    {
        if ($escrow->buyer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string'
        ]);

        try {
            $escrow = $this->escrowService->openDispute($escrow, $request->reason);
            return response()->json($escrow);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
