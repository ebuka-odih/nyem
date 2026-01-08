<?php

namespace App\Services;

use App\Models\Escrow;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Exception;

class EscrowService
{
    protected $oneSignalService;

    public function __construct(OneSignalService $oneSignalService)
    {
        $this->oneSignalService = $oneSignalService;
    }

    /**
     * Step 1: Initialize Escrow
     */
    public function initiate(array $data)
    {
        // $data should include buyer_id, seller_id, amount, description, etc.
        return Escrow::create([
            'buyer_id' => $data['buyer_id'],
            'seller_id' => $data['seller_id'],
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'NGN',
            'description' => $data['description'],
            'payment_provider' => 'paystack',
            'status' => 'initiated',
        ]);
    }

    /**
     * Step 2: Payment Checkout Success (Webhook or Verification)
     * Transitions from 'initiated' to 'funds_locked'
     */
    public function handlePaymentSuccess(Escrow $escrow, string $paystackReference)
    {
        if ($escrow->status !== 'initiated') {
            throw new Exception("Escrow is not in initiated state.");
        }

        // TODO: Verify payment with Paystack API using $paystackReference
        // $isValid = $this->verifyPaystackPayment($paystackReference, $escrow->amount);
        // if (!$isValid) throw ...

        $escrow->update([
            'paystack_reference' => $paystackReference,
            'status' => 'funds_locked',
            'locked_at' => Carbon::now(),
            'seller_notified' => false // Will be handled by Step 3 (Notification logic)
        ]);

        return $escrow;
    }

    /**
     * Step 3: Notify Seller (System Action)
     * (This might be called from a listener or controller after payment success)
     */
    public function notifySeller(Escrow $escrow)
    {
        $seller = $escrow->seller;
        $title = "Payment Secured! 💰";
        $message = "Buyer has paid " . $escrow->currency . " " . number_format($escrow->amount, 2) . ". Funds are locked. Please start the service.";
        
        $this->oneSignalService->sendNotificationToUser(
            $seller, 
            $title, 
            $message, 
            ['escrow_id' => $escrow->id, 'type' => 'escrow_locked']
        );
        
        $escrow->update([
            'seller_notified' => true
        ]);
        
        return $escrow;
    }

    /**
     * Step 4: Seller Acknowledges and Starts Service
     */
    public function acknowledgeService(Escrow $escrow)
    {
        if ($escrow->status !== 'funds_locked') {
            throw new Exception("Cannot start service. Funds are not locked or status is invalid.");
        }

        $escrow->update([
            'seller_acknowledged' => true,
            'acknowledged_at' => Carbon::now(),
            'status' => 'service_in_progress'
        ]);

        return $escrow;
    }

    /**
     * Step 5: Service Completion by Seller
     */
    public function completeService(Escrow $escrow, string $note = null)
    {
        if ($escrow->status !== 'service_in_progress') {
            throw new Exception("Service is not in progress.");
        }

        $escrow->update([
            'completion_note' => $note,
            'completed_at' => Carbon::now(),
        ]);
        
        // Notify Buyer
        $this->oneSignalService->sendNotificationToUser(
            $escrow->buyer,
            "Service Completed! ✅",
            "Seller has marked the service as completed. Please verify and confirm delivery.",
            ['escrow_id' => $escrow->id, 'type' => 'escrow_completed']
        );

        return $escrow;
    }

    /**
     * Step 6: Buyer Confirms Delivery
     */
    public function confirmDelivery(Escrow $escrow)
    {
        // Can confirm if in progress or if seller marked completed
        if ($escrow->status !== 'service_in_progress') {
             throw new Exception("Escrow is not in progress.");
        }

        $escrow->update([
            'buyer_confirmed' => true,
            'confirmed_at' => Carbon::now(),
            'status' => 'delivery_confirmed'
        ]);

        return $escrow;
    }

    /**
     * Step 7 & 8: Release Funds (System authorizes, Paystack settles)
     */
    public function releaseFunds(Escrow $escrow)
    {
        if (!in_array($escrow->status, ['delivery_confirmed', 'released'])) { // Allow calling if already released/authorized to retry settlement?
             if ($escrow->status !== 'delivery_confirmed') {
                 throw new Exception("Cannot release funds. Delivery not confirmed.");
             }
        }

        // Step 7: Authorize
        $escrow->update([
            'release_authorized' => true,
            'authorized_at' => Carbon::now(),
            'status' => 'released' // Updating status here as per user flow
        ]);

        // Step 8: Paystack Settlement (Transfer)
        // This would involve calling Paystack Transfer API
        // $transferRef = $this->paystackTransfer($escrow->seller, $escrow->amount);
        
        // Mocking successful settlement
        $escrow->update([
            'finalized' => true, 
            'released_at' => Carbon::now(),
            // 'paystack_transfer_reference' => $transferRef
        ]);
        
        // Notify Seller
        $this->oneSignalService->sendNotificationToUser(
            $escrow->seller,
            "Funds Released! 💸",
            "Payment of " . $escrow->currency . " " . number_format($escrow->amount, 2) . " has been released to your account.",
            ['escrow_id' => $escrow->id, 'type' => 'escrow_released']
        );

        return $escrow;
    }

    /**
     * Step 9: Dispute Opened
     */
    public function openDispute(Escrow $escrow, string $reason)
    {
        // Dispute can be opened during service or after 'completion' but before 'release'
        // If funds already released, it's too late for escrow (usually).
        if (in_array($escrow->status, ['released', 'refunded', 'cancelled'])) {
            throw new Exception("Cannot open dispute on finalized transaction.");
        }

        $escrow->update([
            'dispute_reason' => $reason,
            'dispute_opened_at' => Carbon::now(),
            'status' => 'disputed'
        ]);
        
        // Notify Admin / Seller
        // $this->oneSignalService->sendNotificationToUser($escrow->seller, "Dispute Opened", ...);

        return $escrow;
    }

    /**
     * Step 10: Refund (Dispute User Won)
     */
    public function refundBuyer(Escrow $escrow)
    {
         if ($escrow->status !== 'disputed' && $escrow->status !== 'funds_locked') {
             // Admin might force refund
         }

         // Paystack Refund API
         
         $escrow->update([
             'resolved_at' => Carbon::now(),
             'status' => 'refunded'
         ]);
         
         return $escrow;
    }
    
    /**
     * Step 11: Release to Seller (Dispute Seller Won)
     */
    public function resolveDisputeRelease(Escrow $escrow)
    {
        if ($escrow->status !== 'disputed') {
             throw new Exception("Escrow is not in dispute.");
        }
        
        // Triggers release
        return $this->releaseFunds($escrow);
    }

    /**
     * Step 12: Auto Release Timeout
     */
    public function handleAutoReleaseTimeout(Escrow $escrow)
    {
        // Logic to check if 72 hours passed since completion/start without dispute
        $escrow->update([
             'auto_released' => true,
        ]);
        
        return $this->releaseFunds($escrow);
    }
}
