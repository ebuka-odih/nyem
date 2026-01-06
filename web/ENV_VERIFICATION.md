# Environment Variable Verification - .env.local

## Current Setup

### Environment File
- **File**: `.env.local` (in `web/` directory)
- **Content**: 
  ```env
  VITE_API_BASE=https://api.nyem.online/backend/public/api
  ```

### Vite Configuration
The `vite.config.ts` uses `loadEnv(mode, '.', '')` which will:
1. Load `.env` (base file)
2. Load `.env.local` (local overrides - **highest priority**)
3. Load `.env.[mode]` (mode-specific, e.g., `.env.development`)
4. Load `.env.[mode].local` (mode-specific local overrides)

## How Vite Loads Environment Variables

Vite's `loadEnv()` function loads environment files in this order (later files override earlier ones):

1. `.env` - Base environment file
2. `.env.local` - **Local overrides (highest priority, gitignored)**
3. `.env.[mode]` - Mode-specific (e.g., `.env.development`)
4. `.env.[mode].local` - Mode-specific local overrides

Since `.env.local` is loaded last, it has the **highest priority** and will override any values from `.env`.

## Verification

### ✅ `.env.local` File Exists
```bash
cat .env.local
# Output:
# VITE_API_BASE=https://api.nyem.online/backend/public/api
```

### ✅ Vite Config Uses loadEnv
```typescript
const env = loadEnv(mode, '.', '');
```
This will load `.env.local` automatically.

### ⚠️ Note: This is `web/` directory
The `web/` directory appears to be a different project structure than `web2/`. 

**If this directory needs API utilities:**
- Check if `utils/api.ts` exists
- If not, you may need to copy from `web2/utils/api.ts`
- Or create API utilities that use `import.meta.env.VITE_API_BASE`

## Accessing in Code

To use `VITE_API_BASE` in your code:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE;
// Will be: https://api.nyem.online/backend/public/api
```

## Testing

1. **Restart Vite dev server** after changing `.env.local`:
   ```bash
   npm run dev
   ```

2. **Check in browser console**:
   ```javascript
   console.log(import.meta.env.VITE_API_BASE);
   // Should output: https://api.nyem.online/backend/public/api
   ```

3. **Verify in Network tab**:
   All API requests should go to:
   ```
   https://api.nyem.online/backend/public/api/*
   ```

## Priority Order

When multiple env files exist:
1. `.env` (base)
2. `.env.local` ← **Highest priority** (overrides everything)
3. `.env.development` (if mode is 'development')
4. `.env.development.local` (if mode is 'development')

**Conclusion**: `.env.local` will always take precedence over `.env`.









