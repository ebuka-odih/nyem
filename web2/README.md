# Nyem Web Application

A modern web application for bartering and trading items, built with React, TypeScript, and Vite.

## Prerequisites

- Node.js (v18 or higher)
- PHP 8.1+ and Composer (for backend)
- Laravel backend running (see backend README)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend

Make sure the Laravel backend is running first:

```bash
cd ../backend
php artisan serve
# Backend will run on http://localhost:8000
```

### 3. Start the Frontend

```bash
npm run dev
# Frontend will run on http://localhost:3000
```

The app will automatically connect to `http://localhost:8000/api` in development mode.

## Configuration

### Environment Variables

The application uses environment variables to configure the API endpoint. Environment files are provided for different environments:

#### Available Environment Files

- **`.env`** - Main environment file (gitignored, **currently configured for production**)
- **`.env.example`** - Template file (committed to git)
- **`.env.local`** - Local development overrides (gitignored)
- **`.env.production`** - Production build overrides (gitignored)

#### Current Configuration

The `.env` file is configured with:
```env
VITE_API_BASE=https://api.nyem.online/backend/public/api
```

**All API endpoints will use this URL** from the `.env` file.

#### Setup for Local Development

If you need to use a local backend, edit `.env`:
```env
VITE_API_BASE=http://localhost:8000/api
```

Or create `.env.local` (which takes precedence):
```bash
cp .env.example .env.local
# Edit .env.local
VITE_API_BASE=http://localhost:8000/api
```

#### Setup for Production

The `.env` file is already configured for production:
```env
VITE_API_BASE=https://api.nyem.online/backend/public/api
```

For deployment, you can also:
1. **Set environment variables in your deployment platform** (recommended):
   - Set `VITE_API_BASE` in your hosting platform's environment variables
   - Vite will automatically use these during build

2. **Use `.env.production` file**:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production URL
   ```

#### API Base URL Configuration

The API base URL is configured via `VITE_API_BASE` in `.env`:
- **Current (Production)**: `https://api.nyem.online/backend/public/api` (set in `.env`)
- **Development fallback**: `http://localhost:8000/api` (only if no env var is set)
- **Production fallback**: `https://api.nyem.online/backend/public/api` (only if no env var is set)

**Priority Order:**
1. `.env` file (or `.env.local` / `.env.production` based on mode)
2. Development mode detection (localhost)
3. Production fallback

**Note**: Environment variables must be prefixed with `VITE_` to be accessible in the browser.

## Troubleshooting

### "Cannot connect to backend API" Error

If you see this error, ensure:

1. **Backend is running**: 
   ```bash
   cd ../backend
   php artisan serve
   ```

2. **Backend is accessible**: Open `http://localhost:8000/api` in your browser - you should see `{"message":"Nyem API"}`

3. **CORS is configured**: Check `backend/config/cors.php` allows requests from your frontend origin

4. **Port is correct**: Default is port 8000. If using a different port, set `VITE_API_BASE` in `.env`

### 419 CSRF Token Mismatch Error

If you see a 419 error, this is a CSRF token issue with Laravel Sanctum:

1. **This is automatically handled**: The app will fetch a CSRF cookie before making POST/PUT/DELETE requests
2. **If it persists**: Try refreshing the page or clearing browser cookies
3. **For development**: Ensure `localhost:3000` is in the `SANCTUM_STATEFUL_DOMAINS` in backend `.env`

### 503 Service Unavailable Error

If you see a 503 error, the backend server is reachable but the application has an issue:

1. **Check backend logs**:
   ```bash
   cd ../backend
   tail -f storage/logs/laravel.log
   ```

2. **Verify database connection**:
   ```bash
   cd ../backend
   php artisan migrate:status
   ```

3. **Check environment variables**:
   ```bash
   cd ../backend
   # Ensure .env file exists and has correct database credentials
   cat .env | grep DB_
   ```

4. **Test API endpoint directly**:
   Open `http://localhost:8000/api` in your browser - should return `{"message":"Nyem API"}`

5. **Restart the backend server**:
   ```bash
   cd ../backend
   php artisan serve
   ```

### Network Errors

- Check browser console for detailed error messages
- Verify backend is running and accessible
- Check CORS configuration in Laravel backend
- Ensure firewall isn't blocking localhost connections

## Development

- **Hot Reload**: Enabled by default with Vite
- **TypeScript**: Full type checking enabled
- **Linting**: Run `npm run lint` (if configured)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Documentation

See [API_INTEGRATION.md](./API_INTEGRATION.md) for detailed API integration documentation.
