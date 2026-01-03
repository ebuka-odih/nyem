# Location Permission Handling Guide

## Overview

This guide explains how the app handles location permissions, including what happens when users deny permission and how to implement fallback strategies.

## Automatic Location Request

The app **automatically requests location permission** when:

1. ✅ User logs in or signs up
2. ✅ App launches and user is already authenticated
3. ✅ User's location is older than 1 hour (re-requests for fresh data)

The location request happens in `LocationContext` which is automatically initialized when the app starts.

## What Happens When Permission is Granted

When the user **grants location permission**:

1. ✅ Current location is retrieved
2. ✅ Location is sent to backend and stored
3. ✅ Live location tracking starts (updates every 30 seconds when app is active)
4. ✅ User can see nearby users and items
5. ✅ Location updates automatically when app comes to foreground

## What Happens When Permission is Denied

When the user **denies location permission**:

### 1. **Graceful Degradation**

The app continues to work but with limited features:

- ❌ Cannot find nearby users/items by distance
- ❌ Cannot show distance to other users
- ✅ Can still browse all items (without distance sorting)
- ✅ Can still use all other features (swiping, messaging, etc.)

### 2. **User Options**

The app provides these options:

#### Option A: Manual Location Entry (City-Based)

Users can manually set their city/region instead of GPS location:

```typescript
// Users can update their city in profile settings
await updateProfile({ city: 'Lagos' });
```

This allows basic location-based features without GPS.

#### Option B: Retry Permission

Users can retry enabling location later:

```typescript
import { useLocation } from './contexts/LocationContext';

const { requestLocation } = useLocation();

// In a button handler
await requestLocation();
```

#### Option C: Continue Without Location

Users can simply continue using the app without location features.

## Implementation Details

### LocationContext Hook

Use the `useLocation` hook to access location state and functions:

```typescript
import { useLocation } from './contexts/LocationContext';

function MyComponent() {
    const {
        locationPermission,      // 'granted' | 'denied' | 'unavailable' | 'checking'
        isUpdatingLocation,      // boolean
        lastLocation,            // { latitude, longitude } | null
        locationError,           // string | null
        requestLocation,         // () => Promise<boolean>
        updateLocation,          // () => Promise<void>
        hasBackendLocation,      // boolean
        locationAgeHours,        // number | null
    } = useLocation();

    // Use these values to customize UI based on location status
}
```

### Showing Location Permission Prompt

Use the `LocationPermissionPrompt` component to show a friendly prompt:

```typescript
import { LocationPermissionPrompt } from './components/LocationPermissionPrompt';

function MyScreen() {
    const { locationPermission } = useLocation();

    return (
        <View>
            {locationPermission === 'denied' && (
                <LocationPermissionPrompt
                    onSkip={() => {
                        // Handle skip action
                        console.log('User skipped location');
                    }}
                />
            )}
            {/* Rest of your UI */}
        </View>
    );
}
```

### Checking Location Status

Check if location is available before showing location-based features:

```typescript
import { useLocation } from './contexts/LocationContext';

function NearbyUsersScreen() {
    const { hasBackendLocation, locationPermission } = useLocation();
    const { token } = useAuth();

    useEffect(() => {
        if (hasBackendLocation && locationPermission === 'granted') {
            // Load nearby users
            loadNearbyUsers();
        } else {
            // Show fallback: all users or message
            loadAllUsers();
        }
    }, [hasBackendLocation, locationPermission]);
}
```

## Fallback Strategies

### Strategy 1: City-Based Location

Instead of GPS coordinates, use the user's city:

```typescript
// Backend: Filter by city instead of radius
$users = User::where('city', $user->city)
    ->where('id', '!=', $user->id)
    ->get();
```

**Pros:**
- Works without GPS permission
- Simple to implement
- Good for broad matching

**Cons:**
- Less accurate than GPS
- City might be large
- Can't calculate exact distance

### Strategy 2: Show All Users

When location is unavailable, show all users instead of nearby:

```typescript
// Frontend
const users = hasBackendLocation 
    ? await getNearbyUsers(token, undefined, undefined, 50)
    : await getAllUsers(token);
```

**Pros:**
- Simple fallback
- Users can still browse

**Cons:**
- Not location-based
- May show irrelevant matches

### Strategy 3: Manual Location Entry

Allow users to manually enter coordinates or select from a map:

```typescript
// Future implementation
function ManualLocationScreen() {
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    const handleConfirm = async () => {
        await updateLocationOnBackend(
            selectedLocation.latitude,
            selectedLocation.longitude,
            token
        );
    };
    
    // Show map picker
}
```

## Best Practices

### 1. **Always Provide Fallback**

Never block users from using the app if they deny location:

```typescript
// ❌ Bad: Blocking
if (!hasBackendLocation) {
    return <Text>Location required to continue</Text>;
}

// ✅ Good: Fallback
if (!hasBackendLocation) {
    return <AllUsersFeed />;
}
```

### 2. **Explain Why Location is Needed**

Show clear messaging about location benefits:

```typescript
<Text>
    Enable location to find users and items near you!
    Your location is never shared with other users.
</Text>
```

### 3. **Make Retry Easy**

Provide easy ways to enable location later:

```typescript
<Button 
    onPress={() => requestLocation()}
    title="Enable Location"
/>
```

### 4. **Respect User Choice**

If user denies permission, don't keep asking:

```typescript
// Only show prompt once per session
if (hasShownLocationPrompt) return null;
```

## Testing Permission Scenarios

### Test Case 1: Permission Granted

1. Open app
2. Grant location permission
3. Verify location is updated
4. Check nearby users feature works

### Test Case 2: Permission Denied

1. Open app
2. Deny location permission
3. Verify app continues to work
4. Check fallback UI is shown

### Test Case 3: Permission Later

1. Deny permission initially
2. Use app without location
3. Later enable in settings
4. Verify location updates automatically

### Test Case 4: Location Unavailable

1. Test on device without GPS
2. Or use browser/devtools to simulate unavailable location
3. Verify graceful degradation

## Troubleshooting

### Permission Not Requesting

**Problem:** Location permission prompt doesn't appear.

**Solutions:**
1. Check if `LocationProvider` wraps your app in `App.tsx`
2. Verify `expo-location` is installed (mobile)
3. Check device/browser settings
4. Look for errors in console

### Permission Always Denied

**Problem:** Permission is always denied even when user grants it.

**Solutions:**
1. Check app permissions in device settings
2. For iOS: Verify `NSLocationWhenInUseUsageDescription` in `app.json`
3. For Android: Verify permissions in `app.json`
4. Try uninstalling and reinstalling app

### Location Not Updating

**Problem:** Location is not updating on backend.

**Solutions:**
1. Check network connection
2. Verify authentication token is valid
3. Check backend API logs
4. Verify rate limiting isn't blocking updates

## Example: Conditional UI Based on Location

```typescript
import { useLocation } from './contexts/LocationContext';
import { LocationPermissionPrompt } from './components/LocationPermissionPrompt';

function FeedScreen() {
    const { hasBackendLocation, locationPermission, requestLocation } = useLocation();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadUsers();
    }, [hasBackendLocation]);

    const loadUsers = async () => {
        if (hasBackendLocation) {
            // Load nearby users
            const response = await getNearbyUsers(token, undefined, undefined, 50);
            setUsers(response.data.users);
        } else {
            // Load all users (fallback)
            const response = await getAllUsers(token);
            setUsers(response.data);
        }
    };

    return (
        <View>
            {locationPermission === 'denied' && (
                <LocationPermissionPrompt
                    onSkip={() => {
                        // Continue without location
                        loadUsers();
                    }}
                />
            )}
            
            {users.map(user => (
                <UserCard key={user.id} user={user} />
            ))}
        </View>
    );
}
```

## Summary

- ✅ Location permission is requested automatically on login
- ✅ App works gracefully without location permission
- ✅ Users can retry enabling location anytime
- ✅ Fallback strategies ensure app remains functional
- ✅ Clear messaging explains why location is needed

The app **never blocks users** from using features if they deny location permission, ensuring a good user experience regardless of permission status.
