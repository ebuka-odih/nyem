# Google OAuth Setup Guide

## Overview
This application uses Google OAuth 2.0 with the **popup flow** (`initTokenClient`). This is a client-side flow that doesn't require server-side redirect handling.

## Google Cloud Console Configuration

### Step 1: Navigate to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (or create a new one)

### Step 2: Configure Authorized JavaScript Origins
Add your application origins under **"Authorized JavaScript origins"**:

**For Development:**
```
http://localhost:5173
http://127.0.0.1:5173
```

**For Production:**
```
https://www.nyem.online
https://nyem.online
```

**Important:**
- Include the protocol (`http://` or `https://`)
- Include the port number for localhost (e.g., `:5173`)
- Do NOT include a path (e.g., `/auth/callback`)
- Do NOT include a trailing slash

### Step 3: Authorized Redirect URIs (REQUIRED)
For the popup flow (`initTokenClient`), you **MUST** also add the origin to "Authorized redirect URIs". 
The redirect URI must be the exact origin (no path) for popup flow.

**For Development:**
```
http://localhost:5173
http://127.0.0.1:5173
```

**For Production:**
```
https://www.nyem.online
https://nyem.online
http://www.nyem.online
```

**Important:**
- The redirect URI must match the JavaScript origin exactly
- Do NOT include a path (e.g., `/auth/google/callback`)
- Include both www and non-www versions if your site uses both
- The redirect URI for popup flow is just the origin, not a callback path

## Environment Variables

### Frontend (.env or .env.local)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://www.nyem.online/api/auth/google/callback  # For redirect flow only
FRONTEND_URL=https://www.nyem.online
APP_URL=https://www.nyem.online
```

The `GOOGLE_REDIRECT_URI` will default to `{APP_URL}/api/auth/google/callback` if not set (for redirect flow).

## How It Works

### Popup Flow (Default)
1. User clicks "Sign in with Google" button
2. Google opens a popup window
3. User authenticates with Google
4. Google returns an access token directly to the callback function
5. The app uses the access token to:
   - Fetch user info from Google
   - Send token to backend for verification
   - Create/update user account

The callback URL is automatically set to:
```javascript
window.location.origin
// Examples:
// Development: http://localhost:5173
// Production: https://www.nyem.online
```

This value must match one of the "Authorized JavaScript origins" in Google Cloud Console.

### Redirect Flow (Alternative)
The system also supports server-side callback route:

1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google/redirect`
3. Backend redirects to Google's authorization page
4. User authenticates with Google
5. Google redirects to `/api/auth/google/callback` with authorization code
6. Backend exchanges code for tokens
7. Backend authenticates user and creates/updates account
8. Backend redirects to frontend with token: `?google_auth=success&token=...&new_user=...`
9. Frontend handles callback, stores token, and navigates user

**Routes:**
- `GET /api/auth/google/redirect` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles Google OAuth callback
- `POST /api/auth/google` - Direct token authentication (popup flow)

For redirect flow, add these to "Authorized Redirect URIs":
```
https://www.nyem.online/api/auth/google/callback
https://nyem.online/api/auth/google/callback
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: The origin is not registered in "Authorized JavaScript origins" or "Authorized Redirect URIs"

**Solution**: 
- For popup flow: Add `window.location.origin` (without path) to BOTH "Authorized JavaScript origins" AND "Authorized Redirect URIs"
- For redirect flow: Add the full callback URL (with path `/api/auth/google/callback`) to "Authorized Redirect URIs"

**Common Mistakes:**
- ❌ Adding `/auth/google/callback` path for popup flow (should be just the origin)
- ❌ Missing www/non-www versions
- ❌ Including `https://` prefix in some configs but not others

### Error: "popup_blocked"
**Cause**: Browser blocked the popup

**Solution**: Allow popups for your domain

### Error: "access_denied"
**Cause**: User denied permission or client ID is incorrect

**Solution**: Check client ID in environment variables

## Current Implementation

The frontend handles the callback automatically:
- Detects `?google_auth=success&token=...` in URL (redirect flow)
- Stores token and fetches user data
- Navigates to appropriate screen (setup_profile for new users, home for existing)

All Google buttons are correctly wired:
- `LoginPrompt.tsx` → calls `onLoginRequest('google')`
- `LoginPromptModal.tsx` → calls `onLogin('google')`
- Both eventually call `loginWithGoogle()` from `AuthContext`

## Security Features

- ✅ State parameter for CSRF protection (redirect flow)
- ✅ Session-based state validation (redirect flow)
- ✅ Error handling and logging
- ✅ Token verification with Google
- ✅ Secure token storage

## Verification

After making changes, you should see in the browser console:
```
[Google Auth] Using origin: https://www.nyem.online
[Google Auth] Client ID: 799510192998-ieg4vff...
```

The redirect URI sent to Google will be: `https://www.nyem.online` (no path for popup flow)



