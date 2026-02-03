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
            'email' => 'alice@example.com',
        ])->assertOk();

        $otpCode = $sendResponse->json('debug_code');
        $this->assertNotEmpty($otpCode);

        $verifyResponse = $this->postJson('/api/auth/verify-otp', [
            'email' => 'alice@example.com',
            'code' => $otpCode,
            'name' => 'Alice Example',
            'password' => 'secret123',
        ])->assertCreated();

        $verifyResponse->assertJsonStructure([
            'token',
            'user' => ['id', 'email', 'username'],
            'new_user',
        ]);
    }
}
