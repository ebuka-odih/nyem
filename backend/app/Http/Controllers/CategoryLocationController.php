<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;

class CategoryLocationController extends Controller
{
    public function categories(Request $request)
    {
        $query = Category::query();
        
        // Filter by parent category if provided (e.g., ?parent=Shop, ?parent=Services, ?parent=Swap)
        if ($request->filled('parent')) {
            $parentName = $request->string('parent');
            $parentCategory = Category::where('name', $parentName)
                ->where('type', 'main')
                ->first();
            
            if ($parentCategory) {
                // Return only sub-categories of this parent
                $query->where('parent_id', $parentCategory->id)
                    ->where('type', 'sub');
            } else {
                // Parent not found, return empty array
                return response()->json(['categories' => []]);
            }
        } else {
            // If no parent specified, return only sub-categories (exclude main categories)
            $query->where('type', 'sub');
        }
        
        $categories = $query->orderBy('order')->get(['id', 'name', 'order']);
        return response()->json(['categories' => $categories]);
    }

    public function locations()
    {
        $locations = Location::orderBy('order')->get(['id', 'name', 'order']);
        return response()->json(['locations' => $locations]);
    }
}
