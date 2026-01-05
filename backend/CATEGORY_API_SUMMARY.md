# Category API - Data Flow Summary

## API Endpoint
```
GET /api/categories?parent=Shop
```

## How It Works

### 1. Request Flow
```
Frontend (web/pages/UploadPage.tsx)
  ↓
Calls: /api/categories?parent=Shop
  ↓
CategoryController@index (backend/app/Http/Controllers/CategoryController.php)
  ↓
Queries Database: Category::where('parent_id', 1)->where('type', 'sub')
  ↓
Returns JSON: { "categories": [...] }
```

### 2. Controller Logic
```php
// CategoryController.php
public function index(Request $request)
{
    if ($request->filled('parent')) {
        // Find parent category (e.g., "Shop")
        $parentCategory = Category::where('name', $parentName)
            ->where('type', 'main')
            ->first();
        
        // Return sub-categories of that parent
        $query->where('parent_id', $parentCategory->id)
              ->where('type', 'sub');
    }
    
    return response()->json(['categories' => $categories]);
}
```

### 3. Database Structure
- **Main Categories**: Shop (ID: 1), Services (ID: 2), Swap (ID: 3)
- **Sub-Categories**: Have `parent_id` pointing to main category
- **Type**: 'main' or 'sub'
- **Order**: Used for sorting

### 4. SQL Query Executed
```sql
SELECT id, name, order 
FROM categories 
WHERE parent_id = 1 AND type = 'sub' 
ORDER BY order ASC
```

## Issue Found & Fixed

### Problem
- Database had only 8 Shop sub-categories
- Seeder expected 13 categories
- Missing: Electronics, Accessories, Garden & Outdoor, Books & Media, Sports

### Root Cause
- Slug field has unique constraint globally
- "Electronics" already existed under Swap category
- Seeder failed when trying to create duplicate slug

### Solution
Updated `CategorySeeder.php` to:
1. Check if category already exists before creating
2. Handle slug conflicts by prefixing with parent name if needed
3. Preserve existing categories when possible

### Result
✅ All 13 expected Shop categories now exist in database
✅ API returns all categories correctly
✅ Frontend will now receive complete category list

## Current Shop Categories (15 total)

### Expected Categories (13):
1. Electronics
2. Accessories
3. Fashion & Clothing
4. Wigs & Hair
5. Beauty & Care
6. Phones & Gadgets
7. Shoes & Bags
8. Baby & Kids
9. Food & Groceries
10. Garden & Outdoor
11. Household
12. Books & Media
13. Sports

### Legacy Categories (2 - can be removed):
- Beauty & Perfume (ID: 4, 0 listings)
- Home & Lifestyle (ID: 6, 0 listings)

## Frontend Usage

### UploadPage.tsx
```typescript
const categoriesUrl = `${ENDPOINTS.categories}?parent=${encodeURIComponent('Shop')}`;
const response = await apiFetch<{ categories: Category[] }>(categoriesUrl);
setCategories(response.categories); // Used in dropdown
```

### Response Format
```json
{
  "categories": [
    {"id": 37, "name": "Electronics", "order": 1},
    {"id": 38, "name": "Accessories", "order": 2},
    // ... more categories
  ]
}
```

## Testing

To test the API:
```bash
# Via curl
curl "http://your-api-url/api/categories?parent=Shop"

# Via artisan tinker
php artisan tinker
$request = new \Illuminate\Http\Request(['parent' => 'Shop']);
$controller = new \App\Http\Controllers\CategoryController();
$response = $controller->index($request);
echo $response->getContent();
```

## Verification

Run the diagnostic script:
```bash
cd backend
php test_category_api.php
```

This will show:
- What categories exist in database
- What seeder expects
- What API returns
- Any missing or extra categories

