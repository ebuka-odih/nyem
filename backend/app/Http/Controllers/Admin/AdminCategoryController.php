<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCategoryController extends Controller
{
    /**
     * Get all categories with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $type = $request->get('type');

        $query = Category::with(['parent', 'children']);

        // Search by name or slug
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($type && in_array($type, ['main', 'sub'])) {
            $query->where('type', $type);
        }

        $categories = $query->orderBy('order', 'asc')
            ->orderBy('name', 'asc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get a specific category with details
     */
    public function show(string $id): JsonResponse
    {
        $category = Category::with(['parent', 'children'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Create a new category
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:main,sub',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('type', 'main'),
            ],
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        // If type is sub, parent_id is required
        if ($validated['type'] === 'sub' && empty($validated['parent_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Parent category is required for sub-categories',
            ], 422);
        }

        // If type is main, parent_id must be null
        if ($validated['type'] === 'main') {
            $validated['parent_id'] = null;
        }

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
            
            // Ensure uniqueness
            $originalSlug = $validated['slug'];
            $counter = 1;
            while (Category::where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        // Set default order if not provided
        if (!isset($validated['order'])) {
            $maxOrder = Category::where('type', $validated['type'])
                ->when($validated['type'] === 'sub', function ($q) use ($validated) {
                    return $q->where('parent_id', $validated['parent_id']);
                })
                ->max('order');
            $validated['order'] = ($maxOrder ?? 0) + 1;
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category->load(['parent', 'children']),
        ], 201);
    }

    /**
     * Update a category
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:main,sub',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('type', 'main'),
                Rule::notIn([$id]), // Cannot be its own parent
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($id),
            ],
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        // If type is sub, parent_id is required
        if (isset($validated['type']) && $validated['type'] === 'sub') {
            if (empty($validated['parent_id']) && !$category->parent_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent category is required for sub-categories',
                ], 422);
            }
            // Use existing parent_id if not provided
            if (!isset($validated['parent_id'])) {
                $validated['parent_id'] = $category->parent_id;
            }
        }

        // If type is main, parent_id must be null
        if (isset($validated['type']) && $validated['type'] === 'main') {
            $validated['parent_id'] = null;
        }

        // Generate slug if name changed and slug not provided
        if (isset($validated['name']) && !isset($validated['slug'])) {
            $newSlug = Str::slug($validated['name']);
            if ($newSlug !== $category->slug) {
                $originalSlug = $newSlug;
                $counter = 1;
                while (Category::where('slug', $newSlug)->where('id', '!=', $id)->exists()) {
                    $newSlug = $originalSlug . '-' . $counter;
                    $counter++;
                }
                $validated['slug'] = $newSlug;
            }
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category->fresh(['parent', 'children']),
        ]);
    }

    /**
     * Delete a category
     */
    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // Check if category has children
        if ($category->children()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with sub-categories. Please delete or move sub-categories first.',
            ], 422);
        }

        // Check if category has associated items/listings/service providers
        if ($category->items()->count() > 0 || $category->listings()->count() > 0 || $category->serviceProviders()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated items, listings, or service providers.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }
}

