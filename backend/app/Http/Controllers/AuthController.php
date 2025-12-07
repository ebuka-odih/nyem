<?php

namespace App\Http\Controllers;

use App\Models\OtpCode;
use App\Models\User;
use App\Services\TwilioService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    protected $twilioService;

    public function __construct()
    {
        // Initialize TwilioService only if credentials are configured
        try {
            $this->twilioService = app(TwilioService::class);
        } catch (\Exception $e) {
            // Twilio not configured, will handle in sendOtp method
            $this->twilioService = null;
        }
    }

    /**
     * Send OTP code to user's phone number via SMS
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        // Generate 6-digit OTP code
        $code = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(5);

        // Store OTP in database
        OtpCode::create([
            'phone' => $data['phone'],
            'code' => $code,
            'expires_at' => $expiry,
        ]);

        // Send OTP via Twilio SMS if configured
        if ($this->twilioService) {
            $smsResult = $this->twilioService->sendOtpCode($data['phone'], $code);

            if (!$smsResult['success']) {
                Log::warning('Failed to send OTP via SMS', [
                    'phone' => $data['phone'],
                    'error' => $smsResult['message'],
                ]);

                // Still return success to prevent phone number enumeration
                // In production, you might want to handle this differently
                return response()->json([
                    'message' => 'OTP code generated. Please check your phone.',
                    'expires_at' => $expiry,
                    // Include debug code only in non-production for testing
                    'debug_code' => app()->environment('local', 'testing') ? $code : null,
                ], 200);
            }
        } else {
            Log::warning('Twilio not configured, OTP not sent via SMS', [
                'phone' => $data['phone'],
            ]);
        }

        return response()->json([
            'message' => 'OTP sent successfully',
            'expires_at' => $expiry,
            // Include debug code only in non-production for testing
            'debug_code' => app()->environment('local', 'testing') ? $code : null,
        ], 200);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'code' => 'required|string|max:6',
            'username' => 'sometimes|string|max:255',
            'bio' => 'sometimes|nullable|string',
            'profile_photo' => 'sometimes|nullable|string|max:65535',
            'city' => 'sometimes|string|max:255',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        $otp = OtpCode::where('phone', $data['phone'])
            ->latest()
            ->first();

        if (! $otp || ! $otp->isValidFor($data['phone'], $data['code'])) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['consumed' => true]);

        $user = User::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'username' => $data['username'] ?? 'user_'.Str::random(6),
                'bio' => $data['bio'] ?? null,
                'profile_photo' => $data['profile_photo'] ?? null,
                'city' => $data['city'] ?? 'Unknown',
                'role' => 'standard_user',
                'otp_verified_at' => now(),
                'password' => isset($data['password']) ? Hash::make($data['password']) : null,
            ]
        );

        $isNewUser = $user->wasRecentlyCreated;

        if (! $user->wasRecentlyCreated) {
            $user->fill([
                'username' => $data['username'] ?? $user->username,
                'bio' => $data['bio'] ?? $user->bio,
                'profile_photo' => $data['profile_photo'] ?? $user->profile_photo,
                'city' => $data['city'] ?? $user->city,
                'password' => isset($data['password']) ? Hash::make($data['password']) : $user->password,
            ]);
            $user->otp_verified_at = now();
        }

        $user->save();

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'new_user' => $isNewUser,
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'username_or_phone' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $data['username_or_phone'])
            ->orWhere('username', $data['username_or_phone'])
            ->orWhere('email', $data['username_or_phone'])
            ->first();

        if (! $user || ! $user->password || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required_without:email|nullable|string|unique:users,phone',
            'email' => 'required_without:phone|nullable|string|email|unique:users,email',
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:6',
            'city' => 'nullable|string|max:255',
            'profile_photo' => 'nullable|string|max:2048',
        ]);

        // Use email as phone identifier if phone not provided
        $phone = $data['phone'] ?? $data['email'] ?? null;
        $email = $data['email'] ?? null;

        $user = User::create([
            'phone' => $phone,
            'email' => $email,
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'city' => $data['city'] ?? 'Unknown',
            'profile_photo' => $data['profile_photo'] ?? null,
            'role' => 'standard_user',
            'otp_verified_at' => now(),
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'new_user' => true,
        ], 201);
    }

    /**
     * Authenticate user with Google OAuth
     * Accepts Google ID token from frontend and verifies it
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function googleAuth(Request $request)
    {
        $data = $request->validate([
            'id_token' => 'sometimes|string',
            'access_token' => 'sometimes|string',
            'email' => 'sometimes|string|email',
            'name' => 'sometimes|string',
            'picture' => 'sometimes|string',
        ]);

        try {
            $googleUser = null;

            // If id_token is provided, verify it
            if (isset($data['id_token'])) {
                $googleUser = $this->verifyGoogleToken($data['id_token']);
            } 
            // If access_token is provided, get user info from Google
            elseif (isset($data['access_token'])) {
                $googleUser = $this->getUserInfoFromAccessToken($data['access_token']);
            }
            
            if (!$googleUser) {
                return response()->json(['message' => 'Invalid Google token'], 401);
            }

            // Extract user information from Google response
            $googleId = $googleUser['sub'];
            $email = $googleUser['email'] ?? null;
            $name = $googleUser['name'] ?? 'User';
            $picture = $googleUser['picture'] ?? null;

            // Find or create user by Google ID
            $user = User::where('google_id', $googleId)->first();

            if (!$user) {
                // Check if user exists with this email
                if ($email) {
                    $user = User::where('email', $email)->first();
                }

                // Create new user if doesn't exist
                if (!$user) {
                    // Generate username from name or email
                    $username = $this->generateUsernameFromName($name, $email);
                    
                    $user = User::create([
                        'google_id' => $googleId,
                        'email' => $email,
                        'username' => $username,
                        'profile_photo' => $picture,
                        'city' => 'Unknown',
                        'role' => 'standard_user',
                        'otp_verified_at' => now(),
                    ]);
                } else {
                    // Link Google account to existing user
                    $user->google_id = $googleId;
                    if (!$user->email && $email) {
                        $user->email = $email;
                    }
                    if (!$user->profile_photo && $picture) {
                        $user->profile_photo = $picture;
                    }
                    $user->save();
                }
            } else {
                // Update user info if changed
                $updated = false;
                if ($email && $user->email !== $email) {
                    $user->email = $email;
                    $updated = true;
                }
                if ($picture && $user->profile_photo !== $picture) {
                    $user->profile_photo = $picture;
                    $updated = true;
                }
                if ($updated) {
                    $user->save();
                }
            }

            $token = $user->createToken('mobile')->plainTextToken;
            $isNewUser = $user->wasRecentlyCreated;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'new_user' => $isNewUser,
            ]);
        } catch (\Exception $e) {
            Log::error('Google OAuth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Google authentication failed',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Verify Google ID token
     * 
     * @param string $idToken
     * @return array|null
     */
    private function verifyGoogleToken(string $idToken): ?array
    {
        try {
            // Verify token with Google
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

            if (!$response->successful()) {
                Log::warning('Google token verification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $tokenData = $response->json();

            // Verify the token is for our client ID
            $clientId = config('services.google.client_id');
            if ($tokenData['aud'] !== $clientId) {
                Log::warning('Google token client ID mismatch', [
                    'expected' => $clientId,
                    'received' => $tokenData['aud'] ?? null,
                ]);
                return null;
            }

            return $tokenData;
        } catch (\Exception $e) {
            Log::error('Error verifying Google token', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get user info from Google access token
     * 
     * @param string $accessToken
     * @return array|null
     */
    private function getUserInfoFromAccessToken(string $accessToken): ?array
    {
        try {
            $response = Http::get('https://www.googleapis.com/oauth2/v2/userinfo', [
                'access_token' => $accessToken,
            ]);

            if (!$response->successful()) {
                Log::warning('Failed to get user info from Google', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $userInfo = $response->json();
            
            // Convert to same format as ID token response
            return [
                'sub' => $userInfo['id'] ?? null,
                'email' => $userInfo['email'] ?? null,
                'name' => $userInfo['name'] ?? null,
                'picture' => $userInfo['picture'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Error getting user info from access token', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Generate a unique username from name or email
     * 
     * @param string $name
     * @param string|null $email
     * @return string
     */
    private function generateUsernameFromName(string $name, ?string $email): string
    {
        // Try to create username from name
        $baseUsername = Str::slug($name, '');
        
        // If name is empty or too short, use email prefix
        if (empty($baseUsername) || strlen($baseUsername) < 3) {
            if ($email) {
                $baseUsername = Str::before($email, '@');
            } else {
                $baseUsername = 'user';
            }
        }

        // Ensure username is unique
        $username = $baseUsername;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        return $username;
    }
}
