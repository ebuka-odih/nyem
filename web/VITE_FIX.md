# Vite 404 Errors - Fix Guide

## Errors Encountered

1. `GET http://localhost:5173/@react-refresh net::ERR_ABORTED 404`
2. `GET http://localhost:5173/App.tsx?t=... net::ERR_ABORTED 404`
3. `GET http://localhost:5173/node_modules/.vite/deps/chunk-... net::ERR_ABORTED 404`
4. `GET http://localhost:5173/manifest.json 404`

## Root Causes

1. **Import Map Conflict**: The `index.html` had an importmap that conflicts with Vite's module resolution
2. **Missing Dependencies**: Vite dependencies need to be properly installed
3. **Port Mismatch**: vite.config.ts had port 3000 but Vite default is 5173
4. **Missing manifest.json**: PWA manifest file was missing

## Fixes Applied

### 1. Removed Import Map from index.html
The importmap was trying to load dependencies from CDN, which conflicts with Vite's bundling:
```html
<!-- REMOVED -->
<script type="importmap">
{
  "imports": {
    "framer-motion": "https://esm.sh/framer-motion@^12.23.26",
    ...
  }
}
</script>
```

Vite will now handle all module resolution through node_modules.

### 2. Updated vite.config.ts
- Changed port from 3000 to 5173 (Vite default)
- Added `optimizeDeps` to pre-bundle dependencies
- Added proper file extensions to resolve

### 3. Created manifest.json
Created `public/manifest.json` for PWA support.

## Next Steps

1. **Reinstall dependencies** (if needed):
   ```bash
   cd web
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Restart Vite dev server**:
   ```bash
   npm run dev
   ```

3. **Clear browser cache** and reload

## Verification

After restarting, you should see:
- No 404 errors in console
- App loads correctly
- All modules resolve properly
- Vite HMR (Hot Module Replacement) works

## If Issues Persist

1. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Check that all files are in correct locations**:
   - `index.html` in root
   - `index.tsx` in root
   - `App.tsx` in root
   - `vite.config.ts` in root

3. **Verify dependencies are installed**:
   ```bash
   ls node_modules/@vitejs
   ls node_modules/react
   ```








