# Service Worker Update System

This document explains the automatic PWA update system that ensures users always get the latest version without needing to uninstall/reinstall the app.

## How It Works

### 1. **Service Worker Versioning**
- Each build automatically updates the service worker version using a build timestamp
- The `vite-plugin-sw-version` plugin injects a unique version number on each build
- This forces the browser to detect the service worker as "new" and trigger update flow

### 2. **Automatic Update Detection**
- The service worker checks for updates:
  - On app load
  - Every 5 minutes while the app is running
  - When the app comes back into focus
  - When the device comes back online
  - Every 10 minutes via background check in `index.html`

### 3. **Update Activation**
- When a new service worker is detected:
  - A notification banner appears at the top of the screen
  - The app automatically reloads after 2 seconds to apply the update
  - Users can click "Update Now" to reload immediately
  - Users can dismiss the banner (update will apply on next app open)

### 4. **Offline Support**
- The service worker caches:
  - **Static assets** (JS, CSS, images) - Cache-first strategy for instant loading
  - **API responses** - Network-first with cache fallback for offline access
  - **HTML/navigation** - Stale-while-revalidate for fast loading with background updates
- All cached data is versioned and old caches are automatically cleaned up

## Files Modified

### Core Files
- `public/sw.js` - Enhanced service worker with versioning and update messaging
- `hooks/useServiceWorker.ts` - React hook for managing service worker updates
- `components/ServiceWorkerUpdate.tsx` - UI component for update notifications
- `App.tsx` - Integrated update system into the app
- `index.html` - Enhanced service worker registration with update checking
- `index.tsx` - Simplified (update logic moved to hook)

### Build System
- `vite-plugin-sw-version.ts` - Vite plugin that injects build timestamp into service worker
- `vite.config.ts` - Added plugin to build pipeline

## Key Features

✅ **Automatic Updates** - No user action required, updates apply automatically  
✅ **Fast Updates** - Updates detected within 5 minutes, applied within 2 seconds  
✅ **Offline Support** - App works offline with cached data  
✅ **Cache Management** - Old caches automatically cleaned up  
✅ **User-Friendly** - Visual notification with option to update immediately  
✅ **Background Updates** - Checks for updates even when app is in background  

## Testing

To test the update system:

1. **Build the app**: `npm run build`
2. **Deploy** the built files
3. **Make a change** and rebuild
4. **Deploy again** - the service worker version will be different
5. **Open the PWA** - within 5 minutes, you should see the update banner
6. **Wait 2 seconds** - the app should automatically reload with the new version

## Manual Update Check

Users can also manually trigger an update check by:
- Refreshing the page (triggers immediate update check)
- Coming back to the app after being away (triggers update check on focus)

## Browser Compatibility

This system works in all modern browsers that support:
- Service Workers
- Cache API
- PostMessage API

Supported browsers:
- Chrome/Edge (Android & Desktop)
- Safari (iOS 11.3+, macOS)
- Firefox (Android & Desktop)
- Samsung Internet

## Troubleshooting

### Updates not appearing?
1. Check browser console for service worker errors
2. Verify service worker is registered: `navigator.serviceWorker.getRegistration()`
3. Check service worker version in `public/sw.js` - should change on each build
4. Clear browser cache and service worker storage if needed

### App stuck on old version?
1. Unregister service worker: DevTools > Application > Service Workers > Unregister
2. Clear cache: DevTools > Application > Storage > Clear site data
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Notes

- The service worker uses `skipWaiting()` to activate immediately on install
- Old caches are cleaned up automatically on activation
- The update banner auto-dismisses and reloads after 2 seconds
- OneSignal push notifications are integrated and work with the service worker

