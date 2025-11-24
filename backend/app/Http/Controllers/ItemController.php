<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    private array $categories = [
        'Electronics',
        'Fashion',
        'Household',
        'Food Items',
        'Accessories',
        'Beauty',
        'Baby/Kids',
        'Books',
        'Sports',
        'Other',
    ];

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => ['required', 'string', Rule::in($this->categories)],
            'condition' => ['required', Rule::in(['new', 'like_new', 'used'])],
            'photos' => 'nullable|array|min:1',
            'photos.*' => 'string|max:2048',
            'looking_for' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $item = Item::create([
            ...$data,
            'user_id' => $user->id,
            'city' => $data['city'] ?? $user->city,
            'status' => 'active',
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function feed(Request $request)
    {
        $user = $request->user();
        $blockedIds = $this->blockedUserIds($user);

        $query = Item::with('user')
            ->where('status', 'active')
            ->where('user_id', '!=', $user->id)
            ->whereNotIn('user_id', $blockedIds)
            ->where('city', $user->city)
            ->latest();

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $items = $query->get();

        return response()->json(['items' => $items]);
    }

    public function show(Request $request, Item $item)
    {
        if ($this->isBlockedBetween($request->user(), $item->user_id)) {
            return response()->json(['message' => 'User blocked'], 403);
        }

        return response()->json(['item' => $item->load('user')]);
    }

    public function update(Request $request, Item $item)
    {
        $this->authorizeItemOwnership($request->user()->id, $item);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'category' => ['sometimes', 'string', Rule::in($this->categories)],
            'condition' => ['sometimes', Rule::in(['new', 'like_new', 'used'])],
            'photos' => 'sometimes|array|min:1',
            'photos.*' => 'string|max:2048',
            'looking_for' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(['active', 'swapped'])],
        ]);

        $item->update($data);

        return response()->json(['item' => $item]);
    }

    public function destroy(Request $request, Item $item)
    {
        $this->authorizeItemOwnership($request->user()->id, $item);
        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    private function authorizeItemOwnership(string $userId, Item $item): void
    {
        if ($item->user_id !== $userId) {
            abort(403, 'You can only manage your own items');
        }
    }
}
