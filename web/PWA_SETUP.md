# PWA Setup Guide

This guide explains how to set up and use the Progressive Web App (PWA) features for Nyem.

## What's Included

The PWA setup includes:
- ✅ Web App Manifest (`manifest.json`)
- ✅ Service Worker (`sw.js`) for offline functionality
- ✅ iOS Safari "Add to Home Screen" support
- ✅ Android Chrome "Install App" support
- ✅ Offline caching and network fallback

## Generating Icons

Before building, you need to generate the required icon sizes:

### Option 1: Using the Generation Script (Recommended)

1. Install sharp (image processing library):
```bash
npm install --save-dev sharp
```

2. Run the icon generation script:
```bash
node generate-icons.js
```

This will generate all required icon sizes from `../app/assets/icon.png` into the `public/` directory.

### Option 2: Manual Icon Generation

If you prefer to generate icons manually, you need to create the following icon files in the `public/` directory:

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels) - **Required for Android**
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels) - **Required for Android**
- `apple-touch-icon.png` (180x180 pixels) - **Required for iOS**
- `favicon.ico` (32x32 pixels)

You can use online tools like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## Building the App

After generating icons, build the app:

```bash
npm run build
```

The build output will be in the `dist/` directory, including:
- `manifest.json`
- `sw.js` (service worker)
- All icon files
- Your app bundle

## Testing PWA Installation

### Android (Chrome)

1. Build and serve your app over HTTPS (required for PWA)
2. Open the app in Chrome on Android
3. You should see an "Install" banner or menu option
4. Tap "Add to Home Screen" or "Install"
5. The app will be installed and launch in standalone mode

### iOS (Safari)

1. Build and serve your app over HTTPS
2. Open the app in Safari on iOS
3. Tap the Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Customize the name if desired
6. Tap "Add"
7. The app will appear on your home screen and launch in standalone mode

## Development

During development, the service worker is registered but may not work perfectly with Vite's HMR. For best results:

1. Test PWA features in production build: `npm run build && npm run preview`
2. Use Chrome DevTools > Application tab to:
   - View and test the manifest
   - Inspect service worker status
   - Test offline functionality
   - Clear caches if needed

## Service Worker Features

The service worker (`sw.js`) provides:

- **Offline Support**: Caches essential files for offline access
- **Network Fallback**: Serves cached content when network is unavailable
- **Runtime Caching**: Caches assets and API responses on-the-fly
- **Update Detection**: Automatically checks for updates every hour

## Troubleshooting

### Icons not showing
- Ensure all icon files exist in `public/` directory
- Check that icons are properly referenced in `manifest.json`
- Clear browser cache and service worker cache

### "Add to Home Screen" not appearing
- Ensure the app is served over HTTPS (required for PWA)
- Check that `manifest.json` is accessible
- Verify service worker is registered (check browser console)
- On iOS, the prompt only appears when certain criteria are met

### Service Worker not updating
- Clear service worker cache in DevTools > Application > Service Workers
- Unregister the service worker and reload
- Check browser console for errors

## Production Deployment

For production:

1. **HTTPS is Required**: PWAs only work over HTTPS (or localhost for development)
2. **Update Cache Version**: Change `CACHE_NAME` in `sw.js` when deploying updates
3. **Test on Real Devices**: Test installation on actual Android and iOS devices
4. **Monitor Performance**: Use Lighthouse to audit PWA features

## Additional Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

