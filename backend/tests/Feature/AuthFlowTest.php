<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_and_verify_otp(): void
    {
        $sendResponse = $this->postJson('/api/auth/send-otp', [
            'phone' => '1234567890',
        ])->assertOk();

        $otpCode = $sendResponse->json('debug_code');
        $this->assertNotEmpty($otpCode);

        $verifyResponse = $this->postJson('/api/auth/verify-otp', [
            'phone' => '1234567890',
            'code' => $otpCode,
            'username' => 'alice',
            'city' => 'Nairobi',
        ])->assertOk();

        $verifyResponse->assertJsonStructure([
            'token',
            'user' => ['id', 'phone', 'username', 'city'],
            'new_user',
        ]);
    }
}
