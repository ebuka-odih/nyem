<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminCategoriesController extends Controller
{
    /**
     * Display the admin categories page
     */
    public function index(Request $request): Response
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
            ->paginate($perPage)
            ->withQueryString();

        // Get all main categories for parent selection
        $mainCategories = Category::where('type', 'main')
            ->orderBy('order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Admin/Categories', [
            'categories' => $categories,
            'mainCategories' => $mainCategories,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
        ]);
    }
}








