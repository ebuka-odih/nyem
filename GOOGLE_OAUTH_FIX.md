# Google OAuth Fix - redirect_uri_mismatch Error

## Problem
You're getting `Error 400: redirect_uri_mismatch` with `origin=https://www.nyem.online`

## Root Cause
The redirect URI in Google Cloud Console doesn't match what the code is sending. For the popup flow (`initTokenClient`), the redirect URI must be the exact origin (no path).

## Current Google Cloud Console Settings (WRONG)
- ✅ Authorized JavaScript origins: `https://www.nyem.online` and `http://www.nyem.online` (CORRECT)
- ❌ Authorized redirect URIs: `https://nyem.online/auth/google/callback` (WRONG - has a path)

## Required Google Cloud Console Settings (CORRECT)

### Authorized JavaScript Origins (Keep as is)
```
https://www.nyem.online
http://www.nyem.online
```

### Authorized Redirect URIs (FIX THIS)
**Remove:** `https://nyem.online/auth/google/callback`

**Add these instead:**
```
https://www.nyem.online
https://nyem.online
http://www.nyem.online
```

**Important:**
- The redirect URI must be the exact origin (no path, no `/auth/google/callback`)
- Include both www and non-www versions
- The redirect URI for popup flow is just the origin, not a callback path

## Code Changes Made

1. ✅ **Added explicit `redirect_uri` parameter** in `web/contexts/AuthContext.tsx`
   - Now explicitly sets `redirect_uri: window.location.origin`
   - Added console logging for debugging

2. ✅ **Added client ID validation** 
   - Validates that `VITE_GOOGLE_CLIENT_ID` is set

3. ✅ **Endpoint is correct**
   - Frontend calls: `/auth/google` 
   - Backend route: `POST /api/auth/google`
   - Maps to: `AuthController@googleAuth`

4. ✅ **All Google buttons are correctly wired**
   - `LoginPrompt.tsx` → calls `onLoginRequest('google')`
   - `LoginPromptModal.tsx` → calls `onLogin('google')`
   - Both eventually call `loginWithGoogle()` from `AuthContext`

## Steps to Fix

1. **Go to Google Cloud Console**
   - Navigate to: APIs & Services > Credentials
   - Click on your OAuth 2.0 Client ID

2. **Update Authorized Redirect URIs**
   - Remove: `https://nyem.online/auth/google/callback`
   - Add: `https://www.nyem.online`
   - Add: `https://nyem.online` (if you want to support non-www)
   - Add: `http://www.nyem.online` (if you want to support HTTP)

3. **Save the changes**
   - Click "Save" at the bottom
   - Wait a few minutes for changes to propagate

4. **Test the Google Sign-In button**
   - Clear browser cache
   - Try signing in with Google again
   - Check browser console for `[Google Auth] Using origin: ...` log

## Verification

After making the changes, you should see in the browser console:
```
[Google Auth] Using origin: https://www.nyem.online
[Google Auth] Client ID: 799510192998-ieg4vff...
```

The redirect URI sent to Google will be: `https://www.nyem.online` (no path)

## Why This Happens

The `initTokenClient` popup flow uses the origin as the redirect URI, not a callback path. Google requires this exact origin to be registered in BOTH:
1. Authorized JavaScript origins (for security)
2. Authorized redirect URIs (for the OAuth flow)

Even though it's a popup flow, Google still validates the redirect URI.

