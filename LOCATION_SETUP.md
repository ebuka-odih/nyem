# Location Module - Quick Setup Guide

## Prerequisites

- Laravel backend is set up and running
- React Native/Expo frontend is set up
- Database migrations can be run

## Installation Steps

### 1. Backend Setup

#### Run Migration

```bash
cd backend
php artisan migrate
```

This will add the following columns to the `users` table:
- `latitude` (DECIMAL(10,7))
- `longitude` (DECIMAL(10,7))
- `location_updated_at` (TIMESTAMP)

Plus indexes for fast queries.

#### Verify Migration

```bash
php artisan migrate:status
```

You should see `2025_11_28_212722_add_location_fields_to_users_table` as run.

### 2. Frontend Setup

#### Install expo-location (Mobile Only)

```bash
cd app
npm install expo-location
```

**Note**: Web platform uses browser's native `navigator.geolocation` API, so no package is needed for web.

#### Configure Permissions (Mobile)

For iOS, add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses your location to find nearby users and items."
      }
    }
  }
}
```

For Android, add to `app.json`:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### 3. Test the Implementation

#### Test Backend API

1. **Get authentication token** (login or register)

2. **Update location:**
```bash
curl -X POST http://localhost:8001/api/location/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "user": { ... },
    "location_updated_at": "2025-11-28T21:30:00.000000Z"
  }
}
```

3. **Find nearby users:**
```bash
curl -X GET "http://localhost:8001/api/location/nearby?radius=50&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Check location status:**
```bash
curl -X GET http://localhost:8001/api/location/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Frontend

1. **Import location utilities:**
```typescript
import { getCurrentLocation, updateLocationOnBackend } from './src/utils/location';
```

2. **Get and update location:**
```typescript
try {
    const location = await getCurrentLocation();
    await updateLocationOnBackend(location.latitude, location.longitude, token);
    console.log('Location updated:', location);
} catch (error) {
    console.error('Location error:', error);
}
```

3. **Find nearby users:**
```typescript
import { getNearbyUsers } from './src/utils/location';

const response = await getNearbyUsers(token, undefined, undefined, 50);
console.log('Nearby users:', response.data.users);
```

### 4. Usage Examples

See `LOCATION_IMPLEMENTATION.md` for detailed examples including:
- Live location tracking
- Finding nearby users
- Displaying distances
- Error handling

## Troubleshooting

### Backend Issues

**Migration fails:**
- Check database connection
- Ensure users table exists
- Check for conflicting migrations

**Location update fails:**
- Verify user is authenticated (token valid)
- Check rate limiting (60 requests/minute)
- Verify coordinates are valid (-90 to 90 for lat, -180 to 180 for lon)

### Frontend Issues

**Permission denied:**
- Check device/ browser settings
- Request permission explicitly
- Show user-friendly error message

**expo-location not found:**
- Run `npm install expo-location`
- Restart Expo development server
- Check package.json for the dependency

**Location not updating:**
- Check internet connection
- Verify authentication token
- Check backend API logs
- Test API endpoint directly with curl

## Automatic Location Request

✅ **Location is automatically requested when:**
- User logs in or signs up
- App launches with authenticated user
- User's location is older than 1 hour

The `LocationProvider` in `App.tsx` handles this automatically - no additional code needed!

## Handling Permission Denial

If a user denies location permission:

1. ✅ App continues to work (no blocking)
2. ✅ Shows fallback UI (all users instead of nearby)
3. ✅ User can retry enabling location later
4. ✅ City-based location can be used as fallback

See `LOCATION_PERMISSION_HANDLING.md` for detailed guide on permission handling.

## Next Steps

1. ✅ Location automatically requested on login (already implemented)
2. ✅ Live location tracking active (already implemented)
3. Update feed to show distance to items/users (use `useLocation` hook)
4. Add location-based filtering to search (use `hasBackendLocation`)

See `LOCATION_IMPLEMENTATION.md` for complete documentation.

## Support

For issues or questions:
1. Check `LOCATION_IMPLEMENTATION.md` for detailed docs
2. Review error messages in backend logs
3. Test API endpoints directly with curl/Postman
4. Check browser console for frontend errors
