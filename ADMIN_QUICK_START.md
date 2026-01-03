# Admin System Quick Start Guide

## ✅ System Status
The admin system has been fully implemented and verified. All components are in place.

## 🚀 Quick Setup

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

## 📋 Available Admin Routes

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

## 🔒 Security

- All admin routes require authentication (`auth:sanctum`)
- All admin routes require admin role (`admin` middleware)
- Users cannot delete their own account
- All API responses follow standard format: `{ success, message, data }`

## 🧪 Testing

Run the verification script:
```bash
php test_admin_system.php
```

This will verify all components are in place.

## 📝 Notes

- The admin system uses the same authentication as the main app
- Token is stored in `localStorage` as `auth_token`
- Make sure `VITE_API_BASE` is set in `web/.env` if your API is on a different URL
- Default API base: `http://localhost:8001/api`

## 🐛 Troubleshooting

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


























