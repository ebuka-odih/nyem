<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TermiiService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class VerificationController extends Controller
{
    protected $termiiService;

    public function __construct(TermiiService $termiiService)
    {
        $this->termiiService = $termiiService;
    }


    /**
     * Send OTP for phone verification
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendSmsOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $phone = $request->phone;

        $result = $this->termiiService->sendTokenOtp($phone);

        if ($result['success'] && !empty($result['pin_id'])) {
            \App\Models\OtpCode::create([
                'phone' => $phone,
                'pin_id' => $result['pin_id'],
                'provider' => 'termii',
                'expires_at' => now()->addMinutes(10),
                'consumed' => false
            ]);
            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully',
                'debug_otp' => null,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'],
        ], 500);
    }
    
    /**
     * Verify the sent OTP (Test endpoint)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifySmsOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $phone = $request->phone;
        $code = $request->code;
        
        $otp = \App\Models\OtpCode::where('phone', $phone)
            ->latest()
            ->first();

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP',
            ], 400);
        }

        if ($otp->provider === 'termii' && $otp->pin_id) {
            if ($otp->expires_at && $otp->expires_at->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 400);
            }

            $verifyResult = $this->termiiService->verifyTokenOtp($otp->pin_id, $code);
            if (!$verifyResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 400);
            }
        } elseif (!$otp->isValidForPhone($phone, $code)) {
             return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP',
            ], 400);
        }

        // OTP Valid
        $otp->update(['consumed' => true]);
        
        return response()->json([
            'success' => true,
            'message' => 'Phone verification successful',
        ]);
    }
}
