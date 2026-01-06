# Environment Configuration

This document explains how to configure the API base URL and other environment variables for the web application.

## Environment Files

### `.env` (Production/Current Configuration)
This file contains the actual environment variables used by the application. It is **not** committed to git.

**Current Configuration:**
```env
VITE_API_BASE=https://api.nyem.online/backend/public/api
```

### `.env.example` (Template)
This file serves as a template and is committed to git. Copy this file to `.env` and modify as needed.

## API Base URL Configuration

The API base URL is configured via the `VITE_API_BASE` environment variable.

### Priority Order

The application uses the following priority order to determine the API base URL:

1. **`.env` file** - `VITE_API_BASE` (highest priority)
2. **Development mode** - Falls back to `http://localhost:8000/api` if no env var is set
3. **Production fallback** - Falls back to `https://api.nyem.online/backend/public/api`

### Current Setup

With the `.env` file configured as:
```env
VITE_API_BASE=https://api.nyem.online/backend/public/api
```

**All API endpoints will use this URL**, regardless of whether you're running in development or production mode.

## How It Works

The API configuration is handled in `utils/api.ts`:

```typescript
const getApiBase = () => {
  // Check for explicit environment variable first (highest priority)
  const envApiBase = import.meta.env.VITE_API_BASE;
  if (envApiBase && envApiBase.trim() !== '') {
    return envApiBase.trim();
  }
  // ... fallback logic
};
```

Since `VITE_API_BASE` is set in `.env`, it will always be used.

## Changing the API URL

### For Production
Edit `.env`:
```env
VITE_API_BASE=https://api.nyem.online/backend/public/api
```

### For Local Development
Edit `.env`:
```env
VITE_API_BASE=http://localhost:8000/api
```

### For Different Environments
You can use different `.env` files:
- `.env` - Default (loaded automatically)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production build (gitignored)

## Verifying Configuration

After setting up the `.env` file, restart your development server:

```bash
npm run dev
```

Check the browser console - you should see:
```
[API Config] Using VITE_API_BASE from environment: https://api.nyem.online/backend/public/api
[API Config] Final API Base URL: https://api.nyem.online/backend/public/api
```

## All Endpoints Use This URL

All API endpoints defined in `constants/endpoints.ts` will automatically use the base URL from `VITE_API_BASE`. For example:

- `POST /auth/login` → `https://api.nyem.online/backend/public/api/auth/login`
- `GET /profile/me` → `https://api.nyem.online/backend/public/api/profile/me`
- `GET /items/feed` → `https://api.nyem.online/backend/public/api/items/feed`

## Additional Environment Variables

### Google OAuth (Optional)
If you need Google OAuth, uncomment and set:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Security Notes

- ✅ `.env` is gitignored - never commit sensitive data
- ✅ `.env.example` is committed - use it as a template
- ✅ Environment variables prefixed with `VITE_` are exposed to the client
- ⚠️ Never put secrets or API keys in `VITE_*` variables

## Troubleshooting

### API calls not using the correct URL

1. **Check `.env` file exists** in the `web2/` directory
2. **Verify `VITE_API_BASE` is set** in `.env`
3. **Restart the dev server** - Vite only loads env vars on startup
4. **Check browser console** for API config logs
5. **Verify no trailing slash** in the URL (should end with `/api` not `/api/`)

### Environment variable not loading

1. Make sure the variable starts with `VITE_`
2. Restart the Vite dev server
3. Clear browser cache if needed
4. Check `vite.config.ts` for any custom env loading logic

## Files

- `.env` - Your actual environment variables (gitignored)
- `.env.example` - Template file (committed to git)
- `utils/api.ts` - API client that uses `VITE_API_BASE`
- `vite.config.ts` - Vite configuration (loads env vars)









