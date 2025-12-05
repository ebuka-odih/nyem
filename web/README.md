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

- **`.env.example`** - Template file (committed to git)
- **`.env.local`** - Local development (gitignored, create from `.env.example`)
- **`.env.production`** - Production build (gitignored)

#### Setup for Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` if needed (defaults to `http://localhost:8000/api`):
   ```env
   VITE_API_BASE=http://localhost:8000/api
   ```

#### Setup for Production

For production builds, you can either:

1. **Use `.env.production` file** (not recommended for sensitive data):
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production URL
   ```

2. **Set environment variables in your deployment platform** (recommended):
   - Set `VITE_API_BASE` in your hosting platform's environment variables
   - Vite will automatically use these during build

#### API Base URL Configuration

The API base URL is configured via `VITE_API_BASE`:
- **Development (default)**: `http://localhost:8000/api` (automatic if no env var set)
- **Production (default)**: `https://api.nyem.online/backend/public/api` (fallback if no env var set)

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
