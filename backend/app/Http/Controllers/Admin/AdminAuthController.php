<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    /**
     * Show the admin login form
     */
    public function showLoginForm()
    {
        // If already authenticated, redirect to admin dashboard
        if (Auth::check() && Auth::user()->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        // Return Inertia login page
        return \Inertia\Inertia::render('Admin/Login');
    }

    /**
     * Handle admin login
     */
    public function login(Request $request)
    {
        $request->validate([
            'username_or_phone' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find user by username, phone, or email
        $user = User::where('phone', $request->username_or_phone)
            ->orWhere('username', $request->username_or_phone)
            ->orWhere('email', $request->username_or_phone)
            ->first();

        // Check credentials
        if (!$user || !$user->password || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username_or_phone' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is admin
        if ($user->role !== 'admin') {
            throw ValidationException::withMessages([
                'username_or_phone' => ['You do not have admin access.'],
            ]);
        }

        // Check if email-based user has verified their email
        if ($user->email && !$user->phone && !$user->email_verified_at) {
            throw ValidationException::withMessages([
                'username_or_phone' => ['Please verify your email address before logging in.'],
            ]);
        }

        // Log the user in using session
        Auth::login($user, $request->filled('remember'));

        $request->session()->regenerate();

        // Redirect to admin dashboard
        return redirect()->route('admin.dashboard');
    }

    /**
     * Handle admin logout
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}

