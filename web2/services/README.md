# Services Layer

This directory contains service modules that provide a clean abstraction layer for API calls. Each service module handles a specific domain of the application.

## Structure

```
services/
├── authService.ts    # Authentication endpoints
├── index.ts          # Central export point
└── README.md         # This file
```

## Auth Service

The `authService.ts` module provides all authentication-related API functions with proper TypeScript types.

### Available Functions

#### Public Endpoints (No Auth Required)

- **`sendOtp(phone: string)`** - Send OTP code to phone number
- **`sendEmailOtp(email: string)`** - Send OTP code to email address
- **`verifyOtp(payload: VerifyOtpRequest)`** - Verify OTP and authenticate user
- **`login(usernameOrPhone: string, password: string)`** - Login with credentials
- **`register(payload: RegisterRequest)`** - Register a new user
- **`loginWithGoogle(payload: GoogleAuthRequest)`** - Authenticate with Google OAuth
- **`forgotPassword(email: string)`** - Request password reset code
- **`resetPassword(payload: ResetPasswordRequest)`** - Reset password with OTP code

#### Protected Endpoints (Requires Auth Token)

- **`verifyPhoneForSeller(phone: string, code: string, token: string)`** - Verify phone for seller (marketplace)

### Usage Example

```typescript
import { sendOtp, verifyOtp, login } from '../services/authService';

// Send OTP
const otpResponse = await sendOtp('+2341234567890');
console.log('Debug code:', otpResponse.debug_code); // Only in dev

// Verify OTP
const authResponse = await verifyOtp({
  phone: '+2341234567890',
  code: '123456',
  username: 'johndoe',
});

// Login
const loginResponse = await login('johndoe', 'password123');
```

### Type Definitions

All request and response types are exported from the service module:

```typescript
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LoginRequest,
  LoginResponse,
  // ... etc
} from '../services/authService';
```

## Integration with Existing Code

The service layer is designed to work alongside the existing `AuthContext` and direct `apiFetch` calls. You can:

1. **Use services directly** - Import and use service functions in components
2. **Use AuthContext** - Continue using the existing `useAuth()` hook (which uses `apiFetch` directly)
3. **Gradual migration** - Migrate components to use services over time

## Backend Endpoints

All services map to backend API endpoints defined in `backend/routes/api.php`:

- `POST /api/auth/send-otp`
- `POST /api/auth/send-email-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-phone-for-seller` (protected)

## Best Practices

1. **Always use services** - Don't call `apiFetch` directly for auth operations
2. **Handle errors** - Services throw errors that should be caught and handled
3. **Type safety** - Use TypeScript types for all requests and responses
4. **Token management** - Services don't manage tokens; use `AuthContext` or `apiFetch` utilities

## Future Services

Additional service modules can be created for:
- `profileService.ts` - Profile management endpoints
- `itemService.ts` - Item/post management endpoints
- `locationService.ts` - Location-related endpoints
- `conversationService.ts` - Chat and messaging endpoints
- `imageService.ts` - Image upload endpoints







