<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageUploadController extends Controller
{
    /**
     * Upload a single image file
     * Accepts multipart/form-data with 'image' field
     * Returns the public URL of the uploaded image
     */
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:10240', // Max 10MB
        ]);

        $user = $request->user();
        
        // Generate unique filename
        $extension = $request->file('image')->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        
        // Store in public disk under items/images directory
        $path = $request->file('image')->storeAs('items/images', $filename, 'public');
        
        // Get the public URL
        $url = Storage::disk('public')->url($path);
        
        return response()->json([
            'success' => true,
            'url' => $url,
            'path' => $path,
        ], 201);
    }

    /**
     * Upload multiple images at once
     * Accepts multipart/form-data with 'images[]' field (array of files)
     * Returns array of public URLs
     */
    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'images' => 'required|array|min:1|max:10', // Max 10 images at once
            'images.*' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:10240', // Max 10MB per image
        ]);

        $user = $request->user();
        $uploadedUrls = [];
        
        foreach ($request->file('images') as $image) {
            // Generate unique filename
            $extension = $image->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            
            // Store in public disk under items/images directory
            $path = $image->storeAs('items/images', $filename, 'public');
            
            // Get the public URL
            $url = Storage::disk('public')->url($path);
            $uploadedUrls[] = $url;
        }
        
        return response()->json([
            'success' => true,
            'urls' => $uploadedUrls,
            'count' => count($uploadedUrls),
        ], 201);
    }

    /**
     * Upload image from base64 data URI
     * Accepts JSON with 'image' field containing base64 data URI
     * Useful for mobile/web apps that capture images as base64
     */
    public function uploadBase64(Request $request)
    {
        $request->validate([
            'image' => 'required|string', // Base64 data URI
        ]);

        $base64Data = $request->input('image');
        
        // Validate base64 data URI format: data:image/{type};base64,{data}
        if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i', $base64Data, $matches)) {
            throw ValidationException::withMessages([
                'image' => ['Invalid image format. Expected base64 data URI (data:image/{type};base64,{data})'],
            ]);
        }

        $imageType = strtolower($matches[1]);
        $imageData = base64_decode($matches[2], true);
        
        if ($imageData === false) {
            throw ValidationException::withMessages([
                'image' => ['Failed to decode base64 image data'],
            ]);
        }

        // Validate file size (max 10MB)
        $sizeInBytes = strlen($imageData);
        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($sizeInBytes > $maxSize) {
            throw ValidationException::withMessages([
                'image' => ['Image size exceeds maximum allowed size of 10MB'],
            ]);
        }

        // Generate unique filename
        $extension = $imageType === 'jpg' ? 'jpeg' : $imageType;
        $filename = Str::uuid() . '.' . $extension;
        
        // Store in public disk under items/images directory
        $path = 'items/images/' . $filename;
        Storage::disk('public')->put($path, $imageData);
        
        // Get the public URL
        $url = Storage::disk('public')->url($path);
        
        return response()->json([
            'success' => true,
            'url' => $url,
            'path' => $path,
        ], 201);
    }

    /**
     * Upload multiple images from base64 data URIs
     * Accepts JSON with 'images' array containing base64 data URIs
     */
    public function uploadMultipleBase64(Request $request)
    {
        $request->validate([
            'images' => 'required|array|min:1|max:10', // Max 10 images at once
            'images.*' => 'required|string', // Base64 data URI
        ]);

        $uploadedUrls = [];
        $errors = [];
        
        foreach ($request->input('images') as $index => $base64Data) {
            try {
                // Validate base64 data URI format
                if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i', $base64Data, $matches)) {
                    $errors[] = "Image at index {$index}: Invalid format";
                    continue;
                }

                $imageType = strtolower($matches[1]);
                $imageData = base64_decode($matches[2], true);
                
                if ($imageData === false) {
                    $errors[] = "Image at index {$index}: Failed to decode base64 data";
                    continue;
                }

                // Validate file size (max 10MB)
                $sizeInBytes = strlen($imageData);
                $maxSize = 10 * 1024 * 1024; // 10MB
                if ($sizeInBytes > $maxSize) {
                    $errors[] = "Image at index {$index}: Size exceeds 10MB";
                    continue;
                }

                // Generate unique filename
                $extension = $imageType === 'jpg' ? 'jpeg' : $imageType;
                $filename = Str::uuid() . '.' . $extension;
                
                // Store in public disk under items/images directory
                $path = 'items/images/' . $filename;
                Storage::disk('public')->put($path, $imageData);
                
                // Get the public URL
                $url = Storage::disk('public')->url($path);
                $uploadedUrls[] = $url;
            } catch (\Exception $e) {
                $errors[] = "Image at index {$index}: " . $e->getMessage();
            }
        }
        
        if (empty($uploadedUrls) && !empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images',
                'errors' => $errors,
            ], 422);
        }
        
        return response()->json([
            'success' => true,
            'urls' => $uploadedUrls,
            'count' => count($uploadedUrls),
            'errors' => $errors, // Include any errors for partial success
        ], 201);
    }
}






















