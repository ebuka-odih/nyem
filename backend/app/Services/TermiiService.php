<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Termii SMS Service
 * 
 * Handles sending SMS messages via Termii API
 */
class TermiiService
{
    protected $apiKey;
    protected $baseUrl;
    protected $from;
    protected $channel;

    public function __construct()
    {
        $this->apiKey = config('services.termii.api_key');
        $this->baseUrl = rtrim(config('services.termii.base_url'), '/');
        $this->from = config('services.termii.from');
        $this->channel = config('services.termii.channel');

        if (!$this->apiKey) {
            throw new \Exception('Termii API key not configured. Please set TERMII_API in your .env file.');
        }
    }

    /**
     * Send SMS message
     * 
     * @param string $to Phone number to send to
     * @param string $message Message content
     * @return array Response with success status and message
     */
    public function sendSms(string $to, string $message): array
    {
        try {
            // Termii expects phone numbers in a specific format (usually without + for Nigerian numbers, or with country code)
            // But let's stay consistent and see if it works with what the user provides.
            $to = $this->formatPhoneNumber($to);

            $response = Http::post("{$this->baseUrl}/api/sms/send", [
                'api_key' => $this->apiKey,
                'to' => $to,
                'from' => $this->from,
                'sms' => $message,
                'type' => 'plain',
                'channel' => $this->channel,
            ]);

            $data = $response->json();

            if ($response->successful()) {
                Log::info('Termii SMS sent successfully', [
                    'to' => $to,
                    'message_id' => $data['message_id'] ?? 'N/A',
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'data' => $data,
                ];
            } else {
                Log::error('Termii SMS failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'response' => $data,
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to send SMS: ' . ($data['message'] ?? 'Unknown error'),
                ];
            }
        } catch (\Exception $e) {
            Log::error('Termii Service Exception', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Termii service error: ' . $e->getMessage(),
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
        $message = "Your Nyem verification code is: {$code}. This code expires in 7 minutes.";
        
        return $this->sendSms($phone, $message);
    }

    /**
     * Format phone number for Termii
     * 
     * @param string $phone Phone number
     * @return string Formatted phone number
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Termii often prefers numbers without the + prefix
        // For Nigerian numbers, if it starts with 0, replace with 234
        if (str_starts_with($phone, '0') && strlen($phone) === 11) {
            $phone = '234' . substr($phone, 1);
        }

        return $phone;
    }
}
