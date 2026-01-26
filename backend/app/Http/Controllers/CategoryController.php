<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

/**
 * CategoryController
 * 
 * Handles category-related API endpoints for the marketplace.
 * Categories are hierarchical: main categories (Shop, Services, Swap) 
 * have sub-categories.
 */
class CategoryController extends Controller
{
    /**
     * Get categories
     * 
     * Query parameters:
     * - parent (optional): Filter by parent category name (e.g., ?parent=Shop)
     * 
     * If parent is provided, returns only sub-categories of that parent.
     * If no parent is specified, returns all sub-categories.
     */
    public function index(Request $request)
    {
        $query = Category::query();
        
        // Filter by parent category if provided (e.g., ?parent=Shop, ?parent=Services, ?parent=Swap)
        if ($request->filled('parent')) {
            $parentName = $request->string('parent');
            \Log::info('[CategoryController] Filtering by parent:', ['parent' => $parentName]);
            
            $parentCategory = Category::where('name', $parentName)
                ->where('type', 'main')
                ->first();
            
            if ($parentCategory) {
                // Return sub-categories of this parent
                // We don't strictly enforce type='sub' here to be more robust against data inconsistencies
                // as long as it has the correct parent_id
                $query->where('parent_id', $parentCategory->id);
                
                \Log::info('[CategoryController] Found parent category:', ['id' => $parentCategory->id, 'name' => $parentCategory->name]);
            } else {
                // Parent not found, return empty array
                \Log::warning('[CategoryController] Parent category not found:', ['parent' => $parentName]);
                return response()->json(['categories' => []]);
            }
        } else {
            // If no parent specified, return only sub-categories (exclude main categories)
            // NOTE: This returns ALL sub-categories from all parents
            \Log::info('[CategoryController] No parent specified, returning all sub-categories');
            $query->where('type', 'sub');
        }
        
        $categories = $query->orderBy('order')->orderBy('id')->get(['id', 'name', 'order']);
        \Log::info('[CategoryController] Returning categories:', [
            'count' => $categories->count(),
            'ids' => $categories->pluck('id')->toArray(),
            'names' => $categories->pluck('name')->toArray(),
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
        return response()->json(['categories' => $categories]);
    }
}

