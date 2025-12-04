# Admin System Documentation

## Overview
A comprehensive admin system has been built for managing users, matches, items, and viewing platform statistics.

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

## Setup Instructions

### 1. Create an Admin User
To access the admin panel, you need a user with the `admin` role:

```php
// In Laravel Tinker or a seeder
$user = User::where('phone', 'YOUR_PHONE')->first();
$user->role = 'admin';
$user->save();
```

Or create a new admin user:
```php
User::create([
    'phone' => 'YOUR_PHONE',
    'username' => 'admin',
    'city' => 'Your City',
    'role' => 'admin',
    'otp_verified_at' => now(),
    'password' => Hash::make('your_password'),
]);
```

### 2. Frontend Environment Variables
Create a `.env` file in the `web` directory (if not exists):
```
VITE_API_BASE=http://localhost:8001/api
```

### 3. Authentication
The admin system uses the same authentication as the main app:
- Login through the regular sign-in flow
- Token is stored in `localStorage` as `auth_token`
- Admin routes check for both authentication and admin role

### 4. Accessing the Admin Panel
1. Log in as an admin user through the regular sign-in flow
2. Navigate to `/admin` in the web application
3. You'll see the admin dashboard with platform statistics

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
1. Start the Laravel backend server
2. Start the web frontend (`cd web && npm run dev`)
3. Log in as an admin user
4. Navigate to `/admin` to access the admin dashboard
5. Test each section (Users, Matches, Items)

## Notes
- The admin system is fully integrated with the existing authentication system
- All API endpoints follow RESTful conventions
- The UI is responsive and uses ShadCN UI components for consistency
- Pagination is implemented for all list views
- Search and filtering are available where applicable

