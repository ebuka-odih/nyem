# Location Feature - Quick Start

## ✅ Automatic Location Request

The app **automatically requests location** when you open it! No code changes needed.

### What Happens:

1. **On App Launch:**
   - If user is logged in → Location permission is requested automatically
   - If permission granted → Location is retrieved and sent to backend
   - If permission denied → App continues with limited features

2. **On Login/Signup:**
   - After successful authentication → Location permission is requested
   - Location is updated in backend automatically

3. **Background Updates:**
   - Location updates every 30 seconds when app is active
   - Updates when app comes to foreground if location is old (>1 hour)

## 📱 Using Location in Your Components

### Check Location Status

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

### Request Location Manually

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

### Show Permission Prompt

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

## 🔧 Setup Checklist

- [x] Migration run (`php artisan migrate`)
- [x] `LocationProvider` added to `App.tsx` (already done)
- [ ] `expo-location` installed (`npm install expo-location`)
- [ ] Permissions configured in `app.json` (iOS/Android)
- [ ] Test location permission flow

## ❓ FAQ

### Q: Why isn't location permission being requested?

**A:** Check:
1. Is `LocationProvider` in `App.tsx`? ✅ (Already added)
2. Is user logged in? (Location only requested when authenticated)
3. Check console for errors
4. Verify `expo-location` is installed for mobile

### Q: What if user denies permission?

**A:** 
- App continues to work normally
- Location-based features are disabled
- User can enable location later from settings
- See `LOCATION_PERMISSION_HANDLING.md` for details

### Q: How to test location features?

**A:**
1. Grant permission → Test nearby users
2. Deny permission → Test fallback UI
3. Check backend logs for location updates
4. Test on different devices/browsers

### Q: Location not updating on backend?

**A:**
- Check authentication token
- Check network connection
- Check rate limiting (60 requests/minute)
- Check backend API logs

## 📚 Documentation

- `LOCATION_IMPLEMENTATION.md` - Complete technical documentation
- `LOCATION_PERMISSION_HANDLING.md` - Permission denial handling
- `LOCATION_SETUP.md` - Setup instructions

---

**That's it!** Location is already working automatically. Just make sure to install `expo-location` for mobile if you haven't already.
