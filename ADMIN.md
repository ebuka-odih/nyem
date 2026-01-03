# Admin System Documentation

## Overview
A comprehensive admin system for managing users, matches, items, and viewing platform statistics.

## Quick Setup

### 1. Create an Admin User

**Option A: Using the Seeder**
```bash
cd backend
php artisan db:seed --class=AdminUserSeeder
```

**Option B: Using Laravel Tinker**
```bash
cd backend
php artisan tinker
```
Then run:
```php
$user = \App\Models\User::where('phone', 'YOUR_PHONE')->first();
$user->role = 'admin';
$user->save();
```

**Option C: Direct Database Update**
```sql
UPDATE users SET role = 'admin' WHERE phone = 'YOUR_PHONE';
```

### 2. Start the Servers

**Backend:**
```bash
cd backend
php artisan serve
# Server runs on http://localhost:8000
```

**Frontend:**
```bash
cd web
npm run dev
# Frontend runs on http://localhost:5173 (or similar)
```

### 3. Access the Admin Panel

1. Open your browser and go to the frontend URL (e.g., `http://localhost:5173`)
2. Log in with your admin user credentials
3. Navigate to `/admin` in your browser
4. You should see the admin dashboard!

## Backend Implementation

### Middleware
- **EnsureUserIsAdmin** (`backend/app/Http/Middleware/EnsureUserIsAdmin.php`)
  - Checks if the authenticated user has the `admin` role
  - Returns 403 if user is not an admin

### Controllers
All controllers are located in `backend/app/Http/Controllers/Admin/`:

1. **AdminController** - Dashboard statistics
   - `GET /api/admin/dashboard` - Get platform statistics

2. **AdminUserController** - User management
   - `GET /api/admin/users` - List all users (with pagination, search, role filter)
   - `GET /api/admin/users/{id}` - Get user details
   - `PUT /api/admin/users/{id}` - Update user (role, username, bio, city)
   - `DELETE /api/admin/users/{id}` - Delete user

3. **AdminMatchController** - Match management
   - `GET /api/admin/matches` - List all matches (with pagination, search)
   - `GET /api/admin/matches/{id}` - Get match details
   - `DELETE /api/admin/matches/{id}` - Delete match

4. **AdminItemController** - Item management
   - `GET /api/admin/items` - List all items (with pagination, search, status/category filters)
   - `GET /api/admin/items/{id}` - Get item details
   - `PUT /api/admin/items/{id}` - Update item status
   - `DELETE /api/admin/items/{id}` - Delete item

### Routes
- Admin routes are defined in `backend/routes/admin.php`
- All routes are prefixed with `/api/admin`
- All routes require `auth:sanctum` and `admin` middleware

### Models
- Updated `User` model to include `matchesAsUser1()` and `matchesAsUser2()` relationships

## Frontend Implementation

### Admin UI
Built with React, TypeScript, and ShadCN UI components.

### Pages
Located in `web/src/screens/admin/`:

1. **AdminDashboard** (`/admin`)
   - Displays platform statistics
   - Shows cards for users, matches, items, swipes, messages, and reports

2. **AdminUsers** (`/admin/users`)
   - User management table
   - Search by username, phone, or city
   - Filter by role
   - Edit user role
   - Delete users
   - Pagination support

3. **AdminMatches** (`/admin/matches`)
   - Match management table
   - Search by username
   - View match details
   - Delete matches
   - Pagination support

4. **AdminItems** (`/admin/items`)
   - Item management table
   - Search by title or description
   - Filter by status
   - Update item status
   - Delete items
   - Pagination support

### Components
- **AdminLayout** (`web/src/components/admin/AdminLayout.tsx`)
  - Sidebar navigation
  - Main content area
  - Logout functionality

### Services
- **adminApi** (`web/src/services/adminApi.ts`)
  - API service for all admin endpoints
  - Handles authentication tokens
  - Uses environment variable `VITE_API_BASE` or defaults to `http://localhost:8001/api`

## Available Routes

### Backend API Routes (all require admin authentication)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List users
- `GET /api/admin/users/{id}` - Get user details
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/matches` - List matches
- `GET /api/admin/matches/{id}` - Get match details
- `DELETE /api/admin/matches/{id}` - Delete match
- `GET /api/admin/items` - List items
- `GET /api/admin/items/{id}` - Get item details
- `PUT /api/admin/items/{id}` - Update item
- `DELETE /api/admin/items/{id}` - Delete item

### Frontend Routes
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/matches` - Match management
- `/admin/items` - Item management

## Features

### Dashboard
- Total users count
- Active users count
- New users (today and this week)
- Total matches
- Matches created (today and this week)
- Total items
- Active items
- Total swipes
- Total messages
- Reports count

### User Management
- View all users with pagination
- Search users by username, phone, or city
- Filter by role (standard_user, admin)
- Edit user role
- Delete users (prevents self-deletion)
- View user statistics (items count, matches count, swipes count)

### Match Management
- View all matches with pagination
- Search matches by username
- View match details (users, items, conversation)
- Delete matches

### Item Management
- View all items with pagination
- Search items by title or description
- Filter by status (active, inactive, sold)
- Update item status
- Delete items

## Security
- All admin routes require authentication (`auth:sanctum`)
- All admin routes require admin role (`admin` middleware)
- Users cannot delete their own account
- API responses follow standard format: `{ success, message, data }`

## Testing

Run the verification script:
```bash
php test_admin_system.php
```

Or manually test:
1. Start the Laravel backend server
2. Start the web frontend (`cd web && npm run dev`)
3. Log in as an admin user
4. Navigate to `/admin` to access the admin dashboard
5. Test each section (Users, Matches, Items)

## Troubleshooting

**Routes not working?**
- Make sure the backend server is running
- Check that middleware is registered in `bootstrap/app.php`
- Verify routes are in `routes/admin.php`

**Can't access admin panel?**
- Verify your user has `role = 'admin'` in the database
- Check that you're logged in (token in localStorage)
- Check browser console for API errors

**API errors?**
- Verify `VITE_API_BASE` in `web/.env` matches your backend URL
- Check CORS settings in `backend/config/cors.php`
- Verify Sanctum is configured correctly

## Notes
- The admin system uses the same authentication as the main app
- Token is stored in `localStorage` as `auth_token`
- Make sure `VITE_API_BASE` is set in `web/.env` if your API is on a different URL
- Default API base: `http://localhost:8001/api`
- All API endpoints follow RESTful conventions
- The UI is responsive and uses ShadCN UI components for consistency
- Pagination is implemented for all list views
- Search and filtering are available where applicable


