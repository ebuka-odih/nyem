<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Store a newly created review in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|uuid|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reviewerId = Auth::id();
        $receiverId = $request->receiver_id;

        if ($reviewerId === $receiverId) {
            return response()->json(['message' => 'You cannot review yourself.'], 403);
        }

        // Check if review already exists
        $existingReview = Review::where('reviewer_id', $reviewerId)
            ->where('receiver_id', $receiverId)
            ->first();

        if ($existingReview) {
            // Update existing review
            $existingReview->update([
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);
            return response()->json(['message' => 'Review updated successfully', 'review' => $existingReview]);
        }

        $review = Review::create([
            'reviewer_id' => $reviewerId,
            'receiver_id' => $receiverId,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json(['message' => 'Review submitted successfully', 'review' => $review], 201);
    }

    /**
     * Display a listing of the reviews for a specific user.
     */
    public function index($userId)
    {
        $reviews = Review::where('receiver_id', $userId)
            ->with('reviewer:id,name,username,profile_photo')
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }
}
