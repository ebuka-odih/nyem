<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Storage;

class Listing extends Model
{
    /** @use HasFactory<\Database\Factories\ListingFactory> */
    use HasFactory, HasUuids;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'items';

    /**
     * Available condition options
     */
    public const CONDITION_NEW = 'new';
    public const CONDITION_LIKE_NEW = 'like_new';
    public const CONDITION_USED = 'used';
    public const CONDITION_FAIR = 'fair';

    /**
     * Available status options
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SWAPPED = 'swapped';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAUSED = 'paused';

    /**
     * Available type options
     */
    public const TYPE_BARTER = 'barter';
    public const TYPE_MARKETPLACE = 'marketplace';
    public const TYPE_SERVICES = 'services';
    public const TYPE_SHOP = 'shop';
    public const TYPE_SWAP = 'swap';

    /**
     * Get all available condition options
     *
     * @return array
     */
    public static function getConditionOptions(): array
    {
        return [
            self::CONDITION_NEW,
            self::CONDITION_LIKE_NEW,
            self::CONDITION_USED,
            self::CONDITION_FAIR,
        ];
    }

    /**
     * Get all available status options
     *
     * @return array
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_SWAPPED,
            self::STATUS_PENDING,
            self::STATUS_PAUSED,
        ];
    }

    /**
     * Get all available type options
     *
     * @return array
     */
    public static function getTypeOptions(): array
    {
        return [
            self::TYPE_BARTER,
            self::TYPE_MARKETPLACE,
            self::TYPE_SERVICES,
            self::TYPE_SHOP,
            self::TYPE_SWAP,
        ];
    }

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
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'photos' => 'array',
        'price' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
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
        return $this->hasMany(Swipe::class, 'target_listing_id');
    }

    /**
     * Get all stats (views, likes, shares) for this listing
     */
    public function stats()
    {
        return $this->hasMany(ListingStat::class);
    }

    /**
     * Get views for this listing
     */
    public function views()
    {
        return $this->stats()->where('type', 'view');
    }

    /**
     * Get likes for this listing
     */
    public function likes()
    {
        return $this->stats()->where('type', 'like');
    }

    /**
     * Get shares for this listing
     */
    public function shares()
    {
        return $this->stats()->where('type', 'share');
    }

    /**
     * City accessor with fallback to location
     */
    protected function city(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ?? $this->attributes['location'] ?? null,
        );
    }

    /**
     * Accessor to transform photo URLs to ensure they're accessible from the frontend
     */
    protected function photos(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // Fallback to 'images' column if 'photos' is null
                if ($value === null && isset($this->attributes['images'])) {
                    $value = $this->attributes['images'];
                }

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
            // Updated path from items/images/ to listings/images/
            if (str_contains($url, '/storage/listings/images/') || str_contains($url, '/storage/items/images/')) {
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

        // If it's a storage path (like 'listings/images/filename.jpg' or 'items/images/filename.jpg'), convert to URL
        if (str_starts_with($url, 'listings/images/') || str_starts_with($url, 'items/images/') || str_starts_with($url, 'storage/')) {
            // Remove 'storage/' prefix if present (Storage::url already handles the base path)
            $path = str_replace('storage/', '', $url);
            // Also replace old items/images/ path with listings/images/
            $path = str_replace('items/images/', 'listings/images/', $path);
            return Storage::disk('public')->url($path);
        }

        // If it's just a filename or relative path, assume it's in listings/images
        if (!str_contains($url, '/') && !str_contains($url, '\\')) {
            return Storage::disk('public')->url('listings/images/' . $url);
        }

        // Default: try to use Storage facade to generate URL
        // This handles paths like 'listings/images/filename.jpg'
        return Storage::disk('public')->url($url);
    }
}
