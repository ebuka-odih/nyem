/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Provides a clean service layer for auth operations
 */

import { apiFetch, ApiResponse } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { User } from '../contexts/AuthContext';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Send OTP Request
 */
export interface SendOtpRequest {
  phone: string;
}

/**
 * Send Email OTP Request
 */
export interface SendEmailOtpRequest {
  email: string;
}

/**
 * Send OTP Response
 */
export interface SendOtpResponse {
  message: string;
  expires_at?: string;
  debug_code?: string; // Only in development/testing
}

/**
 * Verify OTP Request
 */
export interface VerifyOtpRequest {
  phone?: string;
  email?: string;
  code: string;
  username?: string;
  bio?: string;
  profile_photo?: string;
  city?: string;
  password?: string;
}

/**
 * Verify OTP Response
 */
export interface VerifyOtpResponse {
  user: User;
  token: string;
  new_user?: boolean;
}

/**
 * Login Request
 */
export interface LoginRequest {
  username_or_phone: string;
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  phone: string;
  username: string;
  password: string;
  city?: string;
  profile_photo?: string;
}

/**
 * Register Response
 */
export interface RegisterResponse {
  requires_verification?: boolean;
  email?: string;
  message?: string;
}

/**
 * Google Auth Request
 */
export interface GoogleAuthRequest {
  access_token: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Google Auth Response
 */
export interface GoogleAuthResponse {
  user: User;
  token: string;
  new_user?: boolean;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Forgot Password Response
 */
export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

/**
 * Reset Password Response
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * Verify Phone for Seller Request (Protected)
 */
export interface VerifyPhoneForSellerRequest {
  phone: string;
  code: string;
}

/**
 * Verify Phone for Seller Response
 */
export interface VerifyPhoneForSellerResponse {
  user: User;
}

// ============================================================================
// Auth Service Functions
// ============================================================================

/**
 * Send OTP code to phone number
 * @param phone - Phone number to send OTP to
 * @returns Promise with OTP response
 */
export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const response = await apiFetch<SendOtpResponse>(
    ENDPOINTS.auth.sendOtp,
    {
      method: 'POST',
      body: { phone } as SendOtpRequest,
    }
  );

  return {
    message: response.message || 'OTP sent successfully',
    expires_at: response.expires_at,
    debug_code: response.debug_code,
  };
}

/**
 * Send OTP code to email address
 * @param email - Email address to send OTP to
 * @returns Promise with OTP response
 */
export async function sendEmailOtp(email: string): Promise<SendOtpResponse> {
  const response = await apiFetch<SendOtpResponse>(
    ENDPOINTS.auth.sendEmailOtp,
    {
      method: 'POST',
      body: { email } as SendEmailOtpRequest,
    }
  );

  return {
    message: response.message || 'OTP sent successfully',
    expires_at: response.expires_at,
    debug_code: response.debug_code,
  };
}

/**
 * Verify OTP code and authenticate user
 * @param payload - OTP verification payload
 * @returns Promise with user data and token
 */
export async function verifyOtp(
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const response = await apiFetch<VerifyOtpResponse>(
    ENDPOINTS.auth.verifyOtp,
    {
      method: 'POST',
      body: payload,
    }
  );

  return {
    user: response.user || response.data?.user,
    token: response.token,
    new_user: response.new_user,
  };
}

/**
 * Login with username/phone and password
 * @param usernameOrPhone - Username or phone number
 * @param password - User password
 * @returns Promise with user data and token
 */
export async function login(
  usernameOrPhone: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>(
    ENDPOINTS.auth.login,
    {
      method: 'POST',
      body: {
        username_or_phone: usernameOrPhone,
        password,
      } as LoginRequest,
    }
  );

  return {
    user: response.user || response.data?.user,
    token: response.token,
  };
}

/**
 * Register a new user
 * @param payload - Registration payload
 * @returns Promise with registration response
 */
export async function register(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  const response = await apiFetch<RegisterResponse>(
    ENDPOINTS.auth.register,
    {
      method: 'POST',
      body: payload,
    }
  );

  return {
    requires_verification: response.requires_verification ?? true,
    email: response.email,
    message: response.message,
  };
}

/**
 * Authenticate with Google OAuth
 * @param payload - Google auth payload with access token
 * @returns Promise with user data and token
 */
export async function loginWithGoogle(
  payload: GoogleAuthRequest
): Promise<GoogleAuthResponse> {
  const response = await apiFetch<GoogleAuthResponse>(
    ENDPOINTS.auth.google,
    {
      method: 'POST',
      body: payload,
    }
  );

  return {
    user: response.user || response.data?.user,
    token: response.token,
    new_user: response.new_user,
  };
}

/**
 * Request password reset code
 * @param email - User email address
 * @returns Promise with response message
 */
export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  const response = await apiFetch<ForgotPasswordResponse>(
    ENDPOINTS.auth.forgotPassword,
    {
      method: 'POST',
      body: { email } as ForgotPasswordRequest,
    }
  );

  return {
    message: response.message || 'If the email exists, a reset code has been sent.',
  };
}

/**
 * Reset password with OTP code
 * @param payload - Reset password payload
 * @returns Promise with response message
 */
export async function resetPassword(
  payload: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const response = await apiFetch<ResetPasswordResponse>(
    ENDPOINTS.auth.resetPassword,
    {
      method: 'POST',
      body: payload,
    }
  );

  return {
    message: response.message || 'Password reset successfully',
  };
}

/**
 * Verify phone number for seller (protected endpoint)
 * @param phone - Phone number to verify
 * @param code - OTP code
 * @param token - Authentication token
 * @returns Promise with updated user data
 */
export async function verifyPhoneForSeller(
  phone: string,
  code: string,
  token: string
): Promise<VerifyPhoneForSellerResponse> {
  const response = await apiFetch<VerifyPhoneForSellerResponse>(
    ENDPOINTS.auth.verifyPhoneForSeller,
    {
      method: 'POST',
      token,
      body: { phone, code } as VerifyPhoneForSellerRequest,
    }
  );

  return {
    user: response.user || response.data?.user,
  };
}

// ============================================================================
// Export all types and functions
// ============================================================================

export type {
  SendOtpRequest,
  SendEmailOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyPhoneForSellerRequest,
  VerifyPhoneForSellerResponse,
};








