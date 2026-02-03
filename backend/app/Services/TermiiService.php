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
     * @param string|null $channel Optional channel override
     * @return array Response with success status and message
     */
    public function sendSms(string $to, string $message, ?string $channel = null): array
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
                'channel' => $channel ?? $this->channel,
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
                // FALLBACK: If 'dnd' failed, try 'generic' if it's not already generic
                if (($channel ?? $this->channel) === 'dnd') {
                    Log::warning('Termii dnd channel failed, retrying with generic channel', [
                        'to' => $to,
                        'response' => $data,
                    ]);
                    return $this->sendSms($to, $message, 'generic');
                }

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
        $message = "(Nyem) Verification Pin is {$code}, it expires in 10mins .";
        
        // Use 'dnd' channel for OTPs to ensure delivery
        return $this->sendSms($phone, $message, 'dnd');
    }

    /**
     * Send OTP token via Termii Token API
     *
     * @param string $phone Phone number
     * @return array Response with success status and pin_id
     */
    public function sendTokenOtp(string $phone): array
    {
        try {
            $to = $this->formatPhoneNumber($phone);

            $payload = [
                'api_key' => $this->apiKey,
                'message_type' => 'NUMERIC',
                'to' => $to,
                'from' => $this->from,
                'channel' => 'dnd',
                'pin_attempts' => 10,
                'pin_time_to_live' => 10,
                'pin_length' => 6,
                'pin_placeholder' => '< 123456 >',
                'message_text' => 'Your pin is < 123456 >',
                'pin_type' => 'NUMERIC',
            ];

            $response = Http::post("{$this->baseUrl}/api/sms/otp/send", $payload);
            $data = $response->json();

            if ($response->successful()) {
                $pinId = $data['pin_id']
                    ?? $data['pinId']
                    ?? ($data['data']['pin_id'] ?? null);

                return [
                    'success' => true,
                    'message' => 'OTP sent successfully',
                    'pin_id' => $pinId,
                    'data' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to send OTP: ' . ($data['message'] ?? 'Unknown error'),
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Termii Token OTP Exception', [
                'to' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Termii token error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify OTP token via Termii Token API
     *
     * @param string $pinId Pin ID from Termii
     * @param string $pin OTP provided by user
     * @return array Response with success status
     */
    public function verifyTokenOtp(string $pinId, string $pin): array
    {
        try {
            $payload = [
                'api_key' => $this->apiKey,
                'pin_id' => $pinId,
                'pin' => $pin,
            ];

            $response = Http::post("{$this->baseUrl}/api/sms/otp/verify", $payload);
            $data = $response->json();

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'OTP verified successfully',
                    'data' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to verify OTP: ' . ($data['message'] ?? 'Unknown error'),
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Termii Token OTP Verify Exception', [
                'pin_id' => $pinId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Termii verify error: ' . $e->getMessage(),
            ];
        }
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
