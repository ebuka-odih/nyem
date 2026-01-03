<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminListingsController extends Controller
{
    /**
     * Display the admin listings page
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $status = $request->get('status');
        $category = $request->get('category');

        $query = Listing::with(['user', 'category']);

        // Search by title or description
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter by category
        if ($category) {
            if (is_numeric($category)) {
                $query->where('category_id', $category);
            } else {
                $categoryModel = Category::where('name', $category)->first();
                if ($categoryModel) {
                    $query->where('category_id', $categoryModel->id);
                }
            }
        }

        $listings = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Listings', [
            'listings' => $listings,
            'items' => $listings, // Include 'items' for backward compatibility
            'filters' => [
                'search' => $search,
                'status' => $status,
                'category' => $category,
            ],
        ]);
    }
}









