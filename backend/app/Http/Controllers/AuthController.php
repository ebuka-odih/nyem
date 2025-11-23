<?php

namespace App\Http\Controllers;

use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $code = (string) random_int(100000, 999999);
        $expiry = now()->addMinutes(5);

        OtpCode::create([
            'phone' => $data['phone'],
            'code' => $code,
            'expires_at' => $expiry,
        ]);

        return response()->json([
            'message' => 'OTP sent',
            'debug_code' => $code, // return code so mobile dev/testing can proceed
            'expires_at' => $expiry,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'code' => 'required|string|max:6',
            'username' => 'sometimes|string|max:255',
            'bio' => 'sometimes|nullable|string',
            'profile_photo' => 'sometimes|nullable|string|max:2048',
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
            'phone' => 'required|string|unique:users,phone',
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:6',
            'city' => 'nullable|string|max:255',
            'profile_photo' => 'nullable|string|max:2048',
        ]);

        $user = User::create([
            'phone' => $data['phone'],
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
}
