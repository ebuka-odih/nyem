<?php

namespace App\Services;

use App\Mail\OtpEmail;
use App\Mail\PasswordResetEmail;
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

    /**
     * Send password reset code via email
     * 
     * @param string $email Recipient email address
     * @param string $code Reset code to send
     * @return array Response with success status and message
     */
    public function sendPasswordResetCode(string $email, string $code): array
    {
        try {
            Mail::to($email)->send(new PasswordResetEmail($code));

            return [
                'success' => true,
                'message' => 'Password reset email sent successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send password reset email: ' . $e->getMessage(),
            ];
        }
    }
}


