<?php

namespace App\Http\Controllers;

use App\Models\OtpCode;
use App\Models\User;
use App\Services\TwilioService;
use App\Services\EmailService;
use App\Services\GoogleAuthService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    protected $twilioService;
    protected $emailService;
    protected $googleAuthService;

    public function __construct()
    {
        // Initialize TwilioService only if credentials are configured
        try {
            $this->twilioService = app(TwilioService::class);
        } catch (\Exception $e) {
            // Twilio not configured, will handle in sendOtp method
            $this->twilioService = null;
        }

        // Initialize EmailService
        $this->emailService = app(EmailService::class);
        
        // Initialize GoogleAuthService
        $this->googleAuthService = app(GoogleAuthService::class);
    }

    /**
     * Send OTP code to user's phone number via SMS or email
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required_without:email|nullable|string|max:20',
            'email' => 'required_without:phone|nullable|string|email|max:255',
        ]);

        // Must provide either phone or email
        if (empty($data['phone']) && empty($data['email'])) {
            return response()->json(['message' => 'Either phone or email is required'], 422);
        }

        // Generate 6-digit OTP code
        $code = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(5);

        // Store OTP in database
        $otpData = [
            'code' => $code,
            'expires_at' => $expiry,
        ];

        if (!empty($data['phone'])) {
            $otpData['phone'] = $data['phone'];
        }

        if (!empty($data['email'])) {
            $otpData['email'] = $data['email'];
        }

        OtpCode::create($otpData);

        // Send OTP via appropriate channel
        if (!empty($data['phone'])) {
            // Send via SMS using Twilio
            if ($this->twilioService) {
                $smsResult = $this->twilioService->sendOtpCode($data['phone'], $code);

                if (!$smsResult['success']) {
                    Log::warning('Failed to send OTP via SMS', [
                        'phone' => $data['phone'],
                        'error' => $smsResult['message'],
                    ]);

                    // Still return success to prevent phone number enumeration
                    return response()->json([
                        'message' => 'OTP code generated. Please check your phone.',
                        'expires_at' => $expiry,
                        'debug_code' => app()->environment('local', 'testing') ? $code : null,
                    ], 200);
                }
            } else {
                Log::warning('Twilio not configured, OTP not sent via SMS', [
                    'phone' => $data['phone'],
                ]);
            }
        } elseif (!empty($data['email'])) {
            // Send via email
            $emailResult = $this->emailService->sendOtpCode($data['email'], $code);

            if (!$emailResult['success']) {
                Log::warning('Failed to send OTP via email', [
                    'email' => $data['email'],
                    'error' => $emailResult['message'],
                ]);

                // Still return success to prevent email enumeration
                return response()->json([
                    'message' => 'OTP code generated. Please check your email.',
                    'expires_at' => $expiry,
                    'debug_code' => app()->environment('local', 'testing') ? $code : null,
                ], 200);
            }
        }

        return response()->json([
            'message' => 'OTP sent successfully',
            'expires_at' => $expiry,
            // Include debug code only in non-production for testing
            'debug_code' => app()->environment('local', 'testing') ? $code : null,
        ], 200);
    }

    /**
     * Send OTP code to user's email
     * Dedicated endpoint for email OTPs
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendEmailOtp(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        // Generate 6-digit OTP code
        $code = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(5);

        // Store OTP in database
        OtpCode::create([
            'email' => $data['email'],
            'code' => $code,
            'expires_at' => $expiry,
        ]);

        // Send OTP via email
        $emailResult = $this->emailService->sendOtpCode($data['email'], $code);

        if (!$emailResult['success']) {
            Log::warning('Failed to send OTP via email', [
                'email' => $data['email'],
                'error' => $emailResult['message'],
            ]);

            // Still return success to prevent email enumeration
            return response()->json([
                'message' => 'OTP code generated. Please check your email.',
                'expires_at' => $expiry,
                'debug_code' => app()->environment('local', 'testing') ? $code : null,
            ], 200);
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
            'phone' => 'required_without:email|nullable|string|max:20',
            'email' => 'required_without:phone|nullable|string|email|max:255',
            'code' => 'required|string|max:6',
            'name' => 'sometimes|string|max:255', // For email registration
            'username' => 'sometimes|string|max:255',
            'bio' => 'sometimes|nullable|string',
            'profile_photo' => 'sometimes|nullable|string|max:65535',
            'city' => 'sometimes|string|max:255',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        // Must provide either phone or email
        if (empty($data['phone']) && empty($data['email'])) {
            return response()->json(['message' => 'Either phone or email is required'], 422);
        }

        // Find OTP by phone or email
        $otpQuery = OtpCode::query();
        if (!empty($data['phone'])) {
            $otpQuery->where('phone', $data['phone']);
            $identifier = $data['phone'];
        } else {
            $otpQuery->where('email', $data['email']);
            $identifier = $data['email'];
        }

        $otp = $otpQuery->latest()->first();

        if (! $otp || ! $otp->isValidFor($identifier, $data['code'])) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['consumed' => true]);

        // Handle phone OTP verification (for seller verification)
        if (!empty($data['phone'])) {
            $user = User::where('phone', $data['phone'])->first();

            if (!$user) {
                // For phone verification, user should already exist (seller verification)
                return response()->json(['message' => 'User not found. Please register first.'], 404);
            }

            // Update phone verification timestamp
            $user->phone_verified_at = now();
            $user->otp_verified_at = now(); // Keep for backward compatibility
            $user->save();

            $token = $user->createToken('mobile')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'new_user' => false,
            ]);
        }

        // Handle email OTP verification (for registration)
        if (!empty($data['email'])) {
            // For email registration, require name and password
            if (empty($data['name']) || empty($data['password'])) {
                return response()->json([
                    'message' => 'Name and password are required for email registration'
                ], 422);
            }

            // Check if user already exists
            $user = User::where('email', $data['email'])->first();

            if ($user) {
                // Existing user - just verify email
                $user->email_verified_at = now();
                $user->otp_verified_at = now(); // Keep for backward compatibility
                
                // Update password if provided
                if (!empty($data['password'])) {
                    $user->password = Hash::make($data['password']);
                }
                
                $user->save();

                $token = $user->createToken('mobile')->plainTextToken;

                return response()->json([
                    'token' => $token,
                    'user' => $user,
                    'new_user' => false,
                ]);
            }

            // Create new user - always generate username from name or email
            // Username is auto-generated, not required from user input
            $username = $this->generateUsernameFromName($data['name'] ?? '', $data['email']);
            
            // Final safety check - ensure username is never empty
            if (empty($username)) {
                $username = 'user_' . Str::random(6);
            }

            $user = User::create([
                'email' => $data['email'],
                'username' => $username,
                'password' => Hash::make($data['password']),
                'bio' => $data['bio'] ?? null,
                'profile_photo' => $data['profile_photo'] ?? null,
                'city' => $data['city'] ?? 'Unknown',
                'role' => 'standard_user',
                'email_verified_at' => now(),
                'otp_verified_at' => now(), // Keep for backward compatibility
            ]);

            $token = $user->createToken('mobile')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'new_user' => true,
            ], 201);
        }
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

        // Check if email-based user has verified their email
        if ($user->email && !$user->phone && !$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email address before logging in',
                'requires_verification' => true,
            ], 403);
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
            'email' => 'required|string|email|unique:users,email',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:6',
        ]);

        // Check if email already exists
        if (User::where('email', $data['email'])->exists()) {
            return response()->json([
                'message' => 'Email already registered. Please login or verify your email.',
            ], 422);
        }

        // Don't create user yet - they need to verify email first
        // Return response indicating email verification is needed
        return response()->json([
            'message' => 'Please verify your email address. An OTP has been sent.',
            'requires_verification' => true,
            'email' => $data['email'],
        ], 200);
    }

    /**
     * Redirect to Google OAuth authorization page
     * Initiates the OAuth flow by redirecting user to Google
     * 
     * @return \Illuminate\Http\RedirectResponse
     */
    public function googleRedirect()
    {
        try {
            $clientId = config('services.google.client_id');
            $redirectUri = config('services.google.redirect');
            $scope = 'email profile';
            $state = Str::random(40); // CSRF protection

            // Store state in session for validation in callback
            session(['google_oauth_state' => $state]);

            $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code',
                'scope' => $scope,
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => $state,
            ]);

            return redirect($authUrl);
        } catch (\Exception $e) {
            Log::error('Google OAuth redirect error', [
                'error' => $e->getMessage(),
            ]);

            return redirect($this->getFrontendUrl() . '?error=' . urlencode('Failed to initiate Google authentication'));
        }
    }

    /**
     * Authenticate user with Google OAuth
     * Accepts Google ID token or access token from frontend and verifies it
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

        // Use GoogleAuthService to handle authentication
        $result = $this->googleAuthService->authenticate($data);

        if (!$result['success']) {
            return response()->json([
                'message' => $result['message'] ?? 'Google authentication failed',
                'error' => $result['error'] ?? null,
            ], 401);
        }

        return response()->json([
            'token' => $result['token'],
            'user' => $result['user'],
            'new_user' => $result['new_user'],
        ]);
    }

    /**
     * Handle Google OAuth callback
     * This route is called by Google after user authorization
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function googleCallback(Request $request)
    {
        try {
            // Get authorization code from Google
            $code = $request->get('code');
            $error = $request->get('error');

            if ($error) {
                Log::warning('Google OAuth callback error', ['error' => $error]);
                return redirect($this->getFrontendUrl() . '?error=' . urlencode($error));
            }

            if (!$code) {
                Log::warning('Google OAuth callback missing code');
                return redirect($this->getFrontendUrl() . '?error=' . urlencode('Missing authorization code'));
            }

            // Validate state (CSRF protection)
            $state = $request->get('state');
            $storedState = session('google_oauth_state');
            if ($state && $storedState && $state !== $storedState) {
                Log::warning('Google OAuth state mismatch', [
                    'received' => $state,
                    'stored' => $storedState,
                ]);
                return redirect($this->getFrontendUrl() . '?error=' . urlencode('Invalid state parameter'));
            }
            
            // Clear state from session
            session()->forget('google_oauth_state');

            // Exchange code for access token
            $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
            ]);

            if (!$tokenResponse->successful()) {
                Log::error('Failed to exchange Google OAuth code', [
                    'status' => $tokenResponse->status(),
                    'body' => $tokenResponse->body(),
                ]);
                return redirect($this->getFrontendUrl() . '?error=' . urlencode('Failed to exchange authorization code'));
            }

            $tokenData = $tokenResponse->json();
            $accessToken = $tokenData['access_token'] ?? null;
            $idToken = $tokenData['id_token'] ?? null;

            if (!$accessToken && !$idToken) {
                Log::error('Google OAuth token response missing tokens', ['response' => $tokenData]);
                return redirect($this->getFrontendUrl() . '?error=' . urlencode('Invalid token response'));
            }

            // Authenticate user using the service
            $authData = [];
            if ($idToken) {
                $authData['id_token'] = $idToken;
            }
            if ($accessToken) {
                $authData['access_token'] = $accessToken;
            }

            $result = $this->googleAuthService->authenticate($authData);

            if (!$result['success']) {
                Log::error('Google OAuth authentication failed in callback', [
                    'message' => $result['message'] ?? 'Unknown error',
                ]);
                return redirect($this->getFrontendUrl() . '?error=' . urlencode($result['message'] ?? 'Authentication failed'));
            }

            // Redirect to frontend with token and user data
            $frontendUrl = $this->getFrontendUrl();
            $token = $result['token'];
            $isNewUser = $result['new_user'] ? 'true' : 'false';

            // Store token in session temporarily for frontend to pick up
            // Or pass it as URL parameter (less secure but simpler)
            // Better approach: use a one-time token or session
            return redirect($frontendUrl . '?google_auth=success&token=' . urlencode($token) . '&new_user=' . $isNewUser);

        } catch (\Exception $e) {
            Log::error('Google OAuth callback exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect($this->getFrontendUrl() . '?error=' . urlencode('An error occurred during authentication'));
        }
    }

    /**
     * Get frontend URL for redirects
     * 
     * @return string
     */
    private function getFrontendUrl(): string
    {
        // Get from environment or use default
        $frontendUrl = env('FRONTEND_URL', 'https://www.nyem.online');
        
        // Remove trailing slash
        return rtrim($frontendUrl, '/');
    }

    /**
     * Verify phone number for seller (marketplace uploads)
     * Requires authentication
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPhoneForSeller(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if phone is already verified
        if ($user->phone_verified_at) {
            return response()->json([
                'message' => 'Phone number already verified',
                'user' => $user,
            ], 200);
        }

        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'code' => 'required|string|max:6',
        ]);

        // Find OTP
        $otp = OtpCode::where('phone', $data['phone'])
            ->latest()
            ->first();

        if (! $otp || ! $otp->isValidForPhone($data['phone'], $data['code'])) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['consumed' => true]);

        // Update user's phone and verification status
        $user->phone = $data['phone'];
        $user->phone_verified_at = now();
        $user->otp_verified_at = now(); // Keep for backward compatibility
        $user->save();

        return response()->json([
            'message' => 'Phone number verified successfully',
            'user' => $user,
        ], 200);
    }


    /**
     * Send forgot password OTP to user's email
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        // Check if user exists (but don't reveal this to prevent enumeration)
        $user = User::where('email', $data['email'])->first();

        // Generate 6-digit OTP code
        $code = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(15); // Longer expiry for password reset

        // Store OTP in database
        OtpCode::create([
            'email' => $data['email'],
            'code' => $code,
            'expires_at' => $expiry,
        ]);

        // Send OTP via email if user exists
        if ($user) {
            $emailResult = $this->emailService->sendPasswordResetCode($data['email'], $code);

            if (!$emailResult['success']) {
                Log::warning('Failed to send password reset code via email', [
                    'email' => $data['email'],
                    'error' => $emailResult['message'],
                ]);
            }
        }

        // Always return success to prevent email enumeration
        return response()->json([
            'message' => 'If an account exists with this email, a reset code has been sent.',
            'expires_at' => $expiry,
            // Include debug code only in non-production for testing
            'debug_code' => app()->environment('local', 'testing') ? $code : null,
        ], 200);
    }

    /**
     * Reset user password with OTP verification
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|string|email|max:255',
            'code' => 'required|string|max:6',
            'password' => 'required|string|min:6',
            'password_confirmation' => 'required|string|same:password',
        ]);

        // Find OTP
        $otp = OtpCode::where('email', $data['email'])
            ->latest()
            ->first();

        if (!$otp || !$otp->isValidFor($data['email'], $data['code'])) {
            return response()->json(['message' => 'Invalid or expired reset code'], 422);
        }

        // Find user
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Update password
        $user->password = Hash::make($data['password']);
        $user->save();

        // Mark OTP as consumed
        $otp->update(['consumed' => true]);

        return response()->json([
            'message' => 'Password reset successfully',
        ], 200);
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
        $baseUsername = !empty($name) ? Str::slug(trim($name), '') : '';
        
        // If name is empty or too short, use email prefix
        if (empty($baseUsername) || strlen($baseUsername) < 3) {
            if ($email) {
                $baseUsername = Str::before($email, '@');
                // Clean up email prefix to make it a valid username
                $baseUsername = Str::slug($baseUsername, '');
            }
            
            // Final fallback if still empty
            if (empty($baseUsername) || strlen($baseUsername) < 3) {
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
