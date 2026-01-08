<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    protected $secretKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secretKey');
        $this->baseUrl = config('services.paystack.paymentUrl');
    }

    /**
     * Get list of banks
     *
     * @return array
     */
    public function getBanks()
    {
        try {
            $response = Http::withToken($this->secretKey)
                ->get("{$this->baseUrl}/bank", [
                    'currency' => 'NGN'
                ]);

            if ($response->successful()) {
                return $response->json()['data'];
            }

            Log::error('Paystack getBanks failed', ['response' => $response->body()]);
            return [];
        } catch (\Exception $e) {
            Log::error('Paystack getBanks exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Resolve account number
     *
     * @param string $accountNumber
     * @param string $bankCode
     * @return array|null
     */
    public function resolveAccountNumber($accountNumber, $bankCode)
    {
        try {
            $response = Http::withToken($this->secretKey)
                ->get("{$this->baseUrl}/bank/resolve", [
                    'account_number' => $accountNumber,
                    'bank_code' => $bankCode
                ]);

            if ($response->successful()) {
                return $response->json()['data'];
            }

            Log::error('Paystack resolveAccountNumber failed', [
                'account' => $accountNumber, 
                'bank' => $bankCode, 
                'response' => $response->body()
            ]);
            
            return null;
        } catch (\Exception $e) {
            Log::error('Paystack resolveAccountNumber exception', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
