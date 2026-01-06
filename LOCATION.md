# Location Feature Documentation

## Quick Start

✅ **Location is automatically requested when:**
- User logs in or signs up
- App launches with authenticated user
- User's location is older than 1 hour

The `LocationProvider` in `App.tsx` handles this automatically - no additional code needed!

## Setup

### 1. Backend Setup

#### Run Migration
```bash
cd backend
php artisan migrate
```

This adds the following columns to the `users` table:
- `latitude` (DECIMAL(10,7))
- `longitude` (DECIMAL(10,7))
- `location_updated_at` (TIMESTAMP)

Plus indexes for fast queries.

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

## How It Works

### Automatic Request Flow
1. User opens app while logged in
2. `LocationProvider` checks if user has token
3. Checks backend for existing location
4. If location is missing or old (>1 hour):
   - Shows permission prompt (system dialog)
   - Gets current location
   - Updates backend automatically
   - Starts live tracking (updates every 30 seconds)
5. If permission denied:
   - Shows friendly alert explaining why location helps
   - App continues to work normally
   - Location-based features are disabled

### Using Location in Your Components

#### Check Location Status
```typescript
import { useLocation } from './contexts/LocationContext';

function MyComponent() {
    const { hasBackendLocation, locationPermission } = useLocation();

    if (!hasBackendLocation) {
        // Show fallback UI
        return <Text>Location not available</Text>;
    }

    // Location available - show location-based features
    return <NearbyUsersList />;
}
```

#### Request Location Manually
```typescript
import { useLocation } from './contexts/LocationContext';

function SettingsScreen() {
    const { requestLocation, locationPermission } = useLocation();

    return (
        <Button
            onPress={requestLocation}
            disabled={locationPermission === 'granted'}
            title="Enable Location"
        />
    );
}
```

## Permission Handling

### When Permission is Granted
- Current location is retrieved
- Location is sent to backend and stored
- Live location tracking starts (updates every 30 seconds when app is active)
- User can see nearby users and items
- Location updates automatically when app comes to foreground

### When Permission is Denied
The app continues to work but with limited features:
- ❌ Cannot find nearby users/items by distance
- ❌ Cannot show distance to other users
- ✅ Can still browse all items (without distance sorting)
- ✅ Can still use all other features (swiping, messaging, etc.)

**Fallback Options:**
1. **Manual Location Entry (City-Based)**: Users can manually set their city/region
2. **Retry Permission**: Users can retry enabling location later
3. **Continue Without Location**: Users can use the app without location features

### Showing Permission Prompt
```typescript
import { LocationPermissionPrompt } from './components/LocationPermissionPrompt';
import { useLocation } from './contexts/LocationContext';

function FeedScreen() {
    const { locationPermission } = useLocation();

    return (
        <View>
            {locationPermission === 'denied' && (
                <LocationPermissionPrompt
                    onSkip={() => {
                        // Handle skip
                    }}
                />
            )}
            {/* Your content */}
        </View>
    );
}
```

## API Endpoints

### Update Location
```bash
curl -X POST http://localhost:8001/api/location/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### Find Nearby Users
```bash
curl -X GET "http://localhost:8001/api/location/nearby?radius=50&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Location Status
```bash
curl -X GET http://localhost:8001/api/location/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Test Different Distances
To test with different locations, manually set coordinates:

**Lagos, Nigeria**: `6.5244, 3.3792`
**Abuja, Nigeria**: `9.0765, 7.3986` (~477km from Lagos)
**Port Harcourt, Nigeria**: `4.8156, 7.0498` (~580km from Lagos)

```bash
curl -X POST http://localhost:8001/api/location/update \
  -H "Authorization: Bearer TOKEN_1" \
  -d '{"latitude": 6.5244, "longitude": 3.3792}'

curl -X POST http://localhost:8001/api/location/update \
  -H "Authorization: Bearer TOKEN_2" \
  -d '{"latitude": 9.0765, "longitude": 7.3986}'
```

### Debugging Distance
If you see `distance_km: 0`, this typically means both users have the same location. This is expected if testing on the same device or very close locations.

Check user locations in database:
```sql
SELECT id, username, latitude, longitude, location_updated_at 
FROM users 
WHERE latitude IS NOT NULL 
ORDER BY location_updated_at DESC;
```

## Troubleshooting

### Permission Not Requesting
- Check if `LocationProvider` wraps your app in `App.tsx`
- Verify user is authenticated (token exists)
- Verify `expo-location` is installed (mobile)
- Check device/browser settings
- Look for errors in console

### Location Not Updating on Backend
- Check authentication token
- Check network connection
- Verify rate limiting (60 requests/minute)
- Check backend API logs
- Test API endpoint directly with curl

### Permission Always Denied
- Check app permissions in device settings
- For iOS: Verify `NSLocationWhenInUseUsageDescription` in `app.json`
- For Android: Verify permissions in `app.json`
- Try uninstalling and reinstalling app

### Distance Shows 0km
- Both users likely have identical coordinates (expected if testing on same device)
- Set different coordinates for each user to test
- Verify coordinates are different in database

## Best Practices

1. **Always Provide Fallback**: Never block users from using the app if they deny location
2. **Explain Why Location is Needed**: Show clear messaging about location benefits
3. **Make Retry Easy**: Provide easy ways to enable location later
4. **Respect User Choice**: If user denies permission, don't keep asking

## Documentation

For detailed technical documentation, see:
- `LOCATION_IMPLEMENTATION.md` - Complete implementation guide with examples



