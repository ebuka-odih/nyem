# Google OAuth Setup Guide

## Overview
This application uses Google OAuth 2.0 with the **popup flow** (`initTokenClient`). This is a client-side flow that doesn't require server-side redirect handling.

## Callback URL Configuration

### Important Notes
- The callback URL is **automatically set** to `window.location.origin` by Google's `initTokenClient`
- You **do NOT** need to configure "Authorized redirect URIs" for this flow
- You **MUST** configure "Authorized JavaScript origins" in Google Cloud Console

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
https://yourdomain.com
https://www.yourdomain.com
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
```

**Important:**
- The redirect URI must match the JavaScript origin exactly
- Do NOT include a path (e.g., `/auth/callback`)
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
GOOGLE_REDIRECT_URI=http://localhost:5173  # Optional, not used for popup flow
```

## How It Works

1. User clicks "Sign in with Google" button
2. Google opens a popup window
3. User authenticates with Google
4. Google returns an access token directly to the callback function
5. The app uses the access token to:
   - Fetch user info from Google
   - Send token to backend for verification
   - Create/update user account

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The origin is not registered in "Authorized JavaScript origins"
- **Solution**: Add `window.location.origin` to "Authorized JavaScript origins" in Google Cloud Console

### Error: "popup_blocked"
- **Cause**: Browser blocked the popup
- **Solution**: Allow popups for your domain

### Error: "access_denied"
- **Cause**: User denied permission or client ID is incorrect
- **Solution**: Check client ID in environment variables

## Current Implementation

The callback URL is automatically set to:
```javascript
window.location.origin
// Examples:
// Development: http://localhost:5173
// Production: https://yourdomain.com
```

This value must match one of the "Authorized JavaScript origins" in Google Cloud Console.

