<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Google Authentication Service
 * 
 * Handles Google OAuth authentication, token verification, and user management
 */
class GoogleAuthService
{
    /**
     * Authenticate user with Google OAuth
     * 
     * @param array $data Request data containing id_token, access_token, email, name, picture
     * @return array Response with success status, user, token, and new_user flag
     */
    public function authenticate(array $data): array
    {
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
                return [
                    'success' => false,
                    'message' => 'Invalid Google token',
                ];
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
                        'email_verified_at' => now(), // Google emails are pre-verified
                        'otp_verified_at' => now(), // Keep for backward compatibility
                    ]);
                    
                    $isNewUser = true;
                } else {
                    // Link Google account to existing user
                    $user->google_id = $googleId;
                    if (!$user->email && $email) {
                        $user->email = $email;
                        $user->email_verified_at = now(); // Google emails are pre-verified
                    }
                    if (!$user->profile_photo && $picture) {
                        $user->profile_photo = $picture;
                    }
                    $user->save();
                    
                    $isNewUser = false;
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
                
                $isNewUser = false;
            }

            $token = $user->createToken('mobile')->plainTextToken;

            return [
                'success' => true,
                'user' => $user,
                'token' => $token,
                'new_user' => $isNewUser,
            ];
        } catch (\Exception $e) {
            Log::error('Google OAuth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Verify Google ID token
     * 
     * @param string $idToken Google ID token
     * @return array|null User info from token or null if invalid
     */
    public function verifyGoogleToken(string $idToken): ?array
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
     * @param string $accessToken Google access token
     * @return array|null User info or null if invalid
     */
    public function getUserInfoFromAccessToken(string $accessToken): ?array
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
     * @param string $name User's name
     * @param string|null $email User's email
     * @return string Generated username
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

