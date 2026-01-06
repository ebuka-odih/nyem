# Listing POST Error Fix

## Problem
POST `/api/posts` returns 500 Internal Server Error when trying to create a listing.

## Root Cause
Database schema mismatch between the migration and the Listing model:

### Migration Creates:
- Column: `images` (JSON)
- Column: `location` (string)
- Type enum: `['shop', 'swap']`
- Status enum: `['active', 'pending', 'paused']`

### Model Expects:
- Column: `photos` (JSON) - accessed via `$listing->photos`
- Column: `city` (string) - accessed via `$listing->city`
- Type: `barter`, `marketplace`, `services`, `shop`, `swap`
- Status: `active`, `swapped`, `pending`, `paused`
- Column: `looking_for` (string, nullable)

## Solution

### 1. Created Migration
Created `2026_01_05_132800_update_listings_table_for_model_compatibility.php` that:
- Renames `images` → `photos`
- Renames `location` → `city`
- Adds `looking_for` column
- Updates `type` enum to include all types
- Updates `status` enum to include `swapped`

### 2. Fixed Listing Model Constants
Added missing constants:
```php
public const TYPE_SHOP = 'shop';
public const TYPE_SWAP = 'swap';
```

## Deployment Steps

1. **Run the migration on production:**
   ```bash
   cd /home/gnoscswa/api.nyem.online/backend
   php artisan migrate
   ```

2. **Verify the schema:**
   ```bash
   php artisan tinker
   Schema::getColumnListing('listings');
   ```

3. **Test creating a listing:**
   ```bash
   curl -X POST https://api.nyem.online/backend/public/api/posts \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Item",
       "description": "Test description",
       "category_id": 1,
       "condition": "new",
       "type": "shop",
       "price": 1000,
       "city": "Lagos",
       "photos": ["https://example.com/image.jpg"]
     }'
   ```

## Expected Result
After running the migration, the listings table should have:
- ✅ `photos` column (not `images`)
- ✅ `city` column (not `location`)
- ✅ `looking_for` column
- ✅ `type` enum with all 5 types
- ✅ `status` enum with all 4 statuses

## Notes
- The migration handles both SQLite (local) and MySQL/PostgreSQL (production)
- SQLite doesn't enforce enum types, so enum changes are handled in application logic
- Existing data will be preserved during column renames


