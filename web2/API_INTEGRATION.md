# API Integration Documentation

This document describes the API integration setup for the Nyem web application.

## Overview

The web application has been fully integrated with the backend API. All authentication flows and main features are now connected to the Laravel backend.

## Setup

### API Configuration

The API base URL is automatically configured based on your environment:
- **Development (localhost)**: Automatically uses `http://localhost:8000/api`
- **Production**: Uses `https://api.nyem.online/backend/public/api`
- **Custom**: Can be overridden via environment variable `VITE_API_BASE`

To use a custom API URL, create a `.env` file in the `web/` directory:
```env
VITE_API_BASE=http://localhost:8000/api
```

**Important**: Make sure your Laravel backend is running before starting the frontend:
```bash
cd backend
php artisan serve
# Backend will run on http://localhost:8000
```

### Authentication

Authentication is handled through Laravel Sanctum tokens. The `AuthContext` manages:
- Token storage in localStorage
- User state management
- Automatic token validation on app load
- Logout functionality

## Connected Features

### Authentication Pages

1. **SignInScreen** (`/components/SignInScreen.tsx`)
   - Connected to `POST /api/auth/login`
   - Validates username/phone and password
   - Stores token and user data on success

2. **SignUpPhoneScreen** (`/components/SignUpPhoneScreen.tsx`)
   - Connected to `POST /api/auth/send-otp`
   - Sends OTP to phone number
   - Handles phone number formatting (+234 prefix)

3. **SignUpOtpScreen** (`/components/SignUpOtpScreen.tsx`)
   - Connected to `POST /api/auth/verify-otp`
   - Verifies OTP code
   - Handles new user vs existing user flow
   - Navigates to profile setup for new users

4. **SetupProfileScreen** (`/components/SetupProfileScreen.tsx`)
   - Connected to `PUT /api/profile/update`
   - Allows new users to set username and city
   - Completes registration process

### Main Application Pages

5. **ProfileScreen** (`/components/ProfileScreen.tsx`)
   - Fetches user profile from `GET /api/profile/me`
   - Displays user information (username, city, bio, avatar)
   - Fetches user's items from `GET /api/items/feed`
   - Logout functionality

6. **EditProfileScreen** (`/components/EditProfileScreen.tsx`)
   - Connected to `PUT /api/profile/update`
   - Allows editing username, city, and bio
   - Refreshes user data after update

7. **SwipeScreen** (`/components/SwipeScreen.tsx`)
   - Fetches items feed from `GET /api/items/feed`
   - Filters items by type (barter/marketplace)
   - Displays items in swipeable card format
   - Handles swipe actions (left/right)

8. **UploadScreen** (`/components/UploadScreen.tsx`)
   - Connected to `POST /api/posts` (alias for items)
   - Creates new items (barter or marketplace)
   - Form validation for required fields
   - Success/error feedback

9. **MatchesScreen** (`/components/MatchesScreen.tsx`)
   - Fetches matches from `GET /api/matches`
   - Fetches pending requests from `GET /api/swipes/pending-requests`
   - Displays match list with last messages
   - Shows unread indicators

## File Structure

```
web/
├── utils/
│   └── api.ts                 # API client utility
├── constants/
│   └── endpoints.ts           # API endpoint definitions
├── contexts/
│   └── AuthContext.tsx        # Authentication context provider
└── components/
    ├── SignInScreen.tsx       # Login page
    ├── SignUpPhoneScreen.tsx  # Phone entry
    ├── SignUpOtpScreen.tsx    # OTP verification
    ├── SetupProfileScreen.tsx # Profile setup
    ├── ProfileScreen.tsx      # User profile
    ├── EditProfileScreen.tsx  # Edit profile
    ├── SwipeScreen.tsx        # Item discovery
    ├── UploadScreen.tsx       # Create item
    └── MatchesScreen.tsx      # Matches list
```

## API Client Usage

### Basic API Call

```typescript
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// GET request
const data = await apiFetch(ENDPOINTS.profile.me, { token });

// POST request
const result = await apiFetch(ENDPOINTS.items.create, {
  method: 'POST',
  token,
  body: { title: 'Item Title', description: 'Description' }
});
```

### Using Auth Context

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  
  // Use auth state and methods
}
```

## Error Handling

All API calls include error handling:
- Network errors are caught and logged
- 401 errors automatically clear invalid tokens
- User-friendly error messages are displayed
- Loading states prevent duplicate requests

## Testing

### Manual Testing Checklist

1. **Authentication Flow**
   - [ ] Sign up with phone number
   - [ ] Verify OTP
   - [ ] Complete profile setup
   - [ ] Login with username/password
   - [ ] Logout

2. **Profile Management**
   - [ ] View profile
   - [ ] Edit profile
   - [ ] View user items

3. **Items**
   - [ ] View items feed
   - [ ] Create new item (barter)
   - [ ] Create new item (marketplace)
   - [ ] Swipe on items

4. **Matches**
   - [ ] View matches list
   - [ ] View pending requests

### API Testing

You can test the API directly using curl:

```bash
# Test login
curl -X POST https://api.nyem.online/backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_phone":"test","password":"password"}'

# Test authenticated endpoint (replace TOKEN)
curl https://api.nyem.online/backend/public/api/profile/me \
  -H "Authorization: Bearer TOKEN"
```

## Environment Variables

Create a `.env` file in the `web/` directory:

```env
# API Configuration
VITE_API_BASE=https://api.nyem.online/backend/public/api

# For local development
# VITE_API_BASE=http://localhost:8000/api
```

## Next Steps

1. **Image Upload**: Implement image upload for profile photos and item images
2. **Real-time Updates**: Add WebSocket support for real-time matches and messages
3. **Location Services**: Integrate location-based filtering
4. **Error Recovery**: Add retry logic for failed requests
5. **Offline Support**: Implement service worker caching for offline functionality

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured to allow requests from your frontend domain
2. **401 Unauthorized**: Check that token is being sent in Authorization header
3. **Network Errors**: Verify API base URL is correct and backend is running
4. **Token Expired**: User will be automatically logged out on 401 response

### Debug Mode

Enable console logging by checking browser console. All API requests are logged with:
- Request method and URL
- Response status
- Error messages

