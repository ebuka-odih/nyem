<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;

class CategoryLocationController extends Controller
{
    public function categories()
    {
        $categories = Category::orderBy('order')->get(['id', 'name', 'order']);
        return response()->json(['categories' => $categories]);
    }

    public function locations()
    {
        $locations = Location::orderBy('order')->get(['id', 'name', 'order']);
        return response()->json(['locations' => $locations]);
    }
}
