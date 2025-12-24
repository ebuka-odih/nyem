<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    /** @use HasFactory<\Database\Factories\ItemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category_id',
        'condition',
        'photos',
        'looking_for',
        'city',
        'status',
        'type',
        'price',
    ];

    protected $casts = [
        'photos' => 'array',
        'price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function swipes()
    {
        return $this->hasMany(Swipe::class, 'target_item_id');
    }

    /**
     * Get all stats (views, likes, shares) for this item
     */
    public function stats()
    {
        return $this->hasMany(ItemStat::class);
    }

    /**
     * Get views for this item
     */
    public function views()
    {
        return $this->stats()->where('type', 'view');
    }

    /**
     * Get likes for this item
     */
    public function likes()
    {
        return $this->stats()->where('type', 'like');
    }

    /**
     * Get shares for this item
     */
    public function shares()
    {
        return $this->stats()->where('type', 'share');
    }

    /**
     * Accessor to transform photo URLs to ensure they're accessible from the frontend
     * This automatically transforms URLs when the photos attribute is accessed
     * 
     * Note: This accessor overrides the 'array' cast, so we handle JSON encoding/decoding manually
     */
    protected function photos(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (empty($value)) {
                    return [];
                }

                // Decode JSON if it's a string (from database)
                $photos = is_string($value) ? json_decode($value, true) : $value;
                
                if (!is_array($photos)) {
                    return [];
                }

                // Transform each photo URL to ensure it's accessible
                return array_map(function ($url) {
                    return $this->transformImageUrl($url);
                }, $photos);
            },
            set: function ($value) {
                // When setting, encode to JSON for database storage
                // Handle both array and JSON string inputs
                if (is_string($value)) {
                    // If it's already a JSON string, validate and return as-is
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        return $value;
                    }
                    // If it's not valid JSON, treat as single URL
                    $value = [$value];
                }
                
                // Ensure it's an array
                if (!is_array($value)) {
                    return json_encode([]);
                }
                
                // Store as JSON string
                return json_encode($value);
            }
        );
    }

    /**
     * Transform a single image URL to ensure it's accessible
     * 
     * @param string $url The image URL to transform
     * @return string The transformed URL
     */
    private function transformImageUrl(string $url): string
    {
        // If empty or already a placeholder, return as is
        if (empty($url) || str_starts_with($url, 'https://via.placeholder.com') || str_starts_with($url, 'https://i.pravatar.cc')) {
            return $url;
        }

        // If it's already a full HTTP/HTTPS URL, check if it needs transformation
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            // If the URL contains the storage path pattern, ensure it's using the correct base URL
            // This handles cases where URLs were generated with wrong APP_URL
            if (str_contains($url, '/storage/items/images/')) {
                // Extract the path after /storage/
                $path = preg_replace('/^.*\/storage\/(.+)$/', '$1', $url);
                // Generate correct URL using Storage facade
                return Storage::disk('public')->url($path);
            }
            // Already a full URL, return as is
            return $url;
        }

        // If it's a relative path starting with /storage/, convert to full URL
        if (str_starts_with($url, '/storage/')) {
            $path = ltrim($url, '/storage/');
            return Storage::disk('public')->url($path);
        }

        // If it's a storage path (like 'items/images/filename.jpg'), convert to URL
        if (str_starts_with($url, 'items/images/') || str_starts_with($url, 'storage/')) {
            // Remove 'storage/' prefix if present (Storage::url already handles the base path)
            $path = str_replace('storage/', '', $url);
            return Storage::disk('public')->url($path);
        }

        // If it's just a filename or relative path, assume it's in items/images
        if (!str_contains($url, '/') && !str_contains($url, '\\')) {
            return Storage::disk('public')->url('items/images/' . $url);
        }

        // Default: try to use Storage facade to generate URL
        // This handles paths like 'items/images/filename.jpg'
        return Storage::disk('public')->url($url);
    }
}
