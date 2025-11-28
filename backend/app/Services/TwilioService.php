<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

/**
 * Twilio SMS Service
 * 
 * Handles sending SMS messages via Twilio API
 */
class TwilioService
{
    protected $client;
    protected $from;

    public function __construct()
    {
        $accountSid = config('services.twilio.account_sid');
        $authToken = config('services.twilio.auth_token');
        $this->from = config('services.twilio.from');

        if (!$accountSid || !$authToken) {
            throw new \Exception('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
        }

        if (!$this->from) {
            throw new \Exception('Twilio FROM number not configured. Please set TWILIO_FROM_NUMBER in your .env file with your Twilio phone number (E.164 format, e.g., +1234567890).');
        }

        $this->client = new Client($accountSid, $authToken);
    }

    /**
     * Send SMS message
     * 
     * @param string $to Phone number to send to (E.164 format)
     * @param string $message Message content
     * @return array Response with success status and message
     */
    public function sendSms(string $to, string $message): array
    {
        try {
            // Ensure phone number is in E.164 format
            $to = $this->formatPhoneNumber($to);

            $message = $this->client->messages->create(
                $to,
                [
                    'from' => $this->from,
                    'body' => $message,
                ]
            );

            Log::info('SMS sent successfully', [
                'to' => $to,
                'message_sid' => $message->sid,
            ]);

            return [
                'success' => true,
                'message' => 'SMS sent successfully',
                'sid' => $message->sid,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send SMS', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send SMS: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send OTP verification code via SMS
     * 
     * @param string $phone Phone number
     * @param string $code OTP code
     * @return array Response with success status
     */
    public function sendOtpCode(string $phone, string $code): array
    {
        $message = "Your Nyem verification code is: {$code}. This code expires in 5 minutes.";
        
        return $this->sendSms($phone, $message);
    }

    /**
     * Format phone number to E.164 format
     * 
     * @param string $phone Phone number
     * @return string Formatted phone number
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If phone doesn't start with +, assume it needs country code
        // For US numbers, add +1 if missing
        if (!str_starts_with($phone, '1') && strlen($phone) === 10) {
            $phone = '1' . $phone;
        }

        // Add + prefix if not present
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        return $phone;
    }
}

