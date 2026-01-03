# Google OAuth Callback Route Setup

## Overview
I've created a callback route for Google OAuth similar to your other app (cityplug.ng). The system now supports both:
1. **Popup flow** (existing) - `initTokenClient` for client-side authentication
2. **Redirect flow** (new) - Server-side callback route for more reliable authentication

## Routes Created

### Backend Routes
1. **GET `/api/auth/google/redirect`** - Initiates Google OAuth flow
   - Redirects user to Google's authorization page
   - Uses state parameter for CSRF protection

2. **GET `/api/auth/google/callback`** - Handles Google OAuth callback
   - Receives authorization code from Google
   - Exchanges code for access token
   - Authenticates user and creates/updates account
   - Redirects to frontend with token

3. **POST `/api/auth/google`** - Direct token authentication (existing)
   - Used by popup flow
   - Accepts `access_token` or `id_token` directly

## Google Cloud Console Configuration

### Authorized JavaScript Origins
```
https://www.nyem.online
http://www.nyem.online
```

### Authorized Redirect URIs
```
https://www.nyem.online/api/auth/google/callback
https://nyem.online/api/auth/google/callback
```

**Important:** The callback URL must include the full path: `/api/auth/google/callback`

## Environment Variables

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://www.nyem.online/api/auth/google/callback
FRONTEND_URL=https://www.nyem.online
APP_URL=https://www.nyem.online
```

The `GOOGLE_REDIRECT_URI` will default to `{APP_URL}/api/auth/google/callback` if not set.

## How It Works

### Redirect Flow (New)
1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google/redirect`
3. Backend redirects to Google's authorization page
4. User authenticates with Google
5. Google redirects to `/api/auth/google/callback` with authorization code
6. Backend exchanges code for tokens
7. Backend authenticates user and creates/updates account
8. Backend redirects to frontend with token: `?google_auth=success&token=...&new_user=...`
9. Frontend handles callback, stores token, and navigates user

### Popup Flow (Existing)
1. User clicks "Sign in with Google" button
2. Google popup opens
3. User authenticates
4. Popup returns access token directly
5. Frontend sends token to `/api/auth/google`
6. Backend verifies and authenticates user

## Frontend Integration

The frontend now handles the callback automatically:
- Detects `?google_auth=success&token=...` in URL
- Stores token and fetches user data
- Navigates to appropriate screen (setup_profile for new users, home for existing)

## Testing

1. **Test redirect flow:**
   ```bash
   # Visit in browser:
   https://www.nyem.online/api/auth/google/redirect
   ```

2. **Test callback:**
   - Complete Google OAuth flow
   - Should redirect to frontend with token

3. **Check logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

## Security Features

- ✅ State parameter for CSRF protection
- ✅ Session-based state validation
- ✅ Error handling and logging
- ✅ Token verification with Google
- ✅ Secure token storage

## Next Steps

1. Update Google Cloud Console with callback URLs
2. Set environment variables in backend
3. Test the redirect flow
4. Optionally update frontend to use redirect flow instead of popup (or support both)

