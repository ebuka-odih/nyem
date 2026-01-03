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
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and has password
        if (!$user || !$user->password) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Get password hash from database attributes to avoid cast issues
        $passwordHash = $user->getAttributes()['password'] 
            ?? $user->getOriginal('password') 
            ?? $user->password;

        // Verify password
        if (!Hash::check($request->password, $passwordHash)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is admin
        if ($user->role !== 'admin') {
            throw ValidationException::withMessages([
                'email' => ['You do not have admin access.'],
            ]);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Please verify your email address before logging in.'],
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
        // Logout the user
        Auth::logout();

        // Invalidate the session
        $request->session()->invalidate();

        // Regenerate CSRF token
        $request->session()->regenerateToken();

        // Clear all session data
        $request->session()->flush();

        // Redirect to login page
        return redirect()->route('login');
    }
}

