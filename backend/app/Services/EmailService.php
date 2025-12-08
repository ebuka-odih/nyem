<?php

namespace App\Services;

use App\Mail\OtpEmail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email Service
 * 
 * Handles sending emails via Laravel Mail
 */
class EmailService
{
    /**
     * Send OTP code via email
     * 
     * @param string $email Recipient email address
     * @param string $code OTP code to send
     * @return array Response with success status and message
     */
    public function sendOtpCode(string $email, string $code): array
    {
        try {
            Mail::to($email)->send(new OtpEmail($code));

            return [
                'success' => true,
                'message' => 'OTP email sent successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send OTP email: ' . $e->getMessage(),
            ];
        }
    }
}


