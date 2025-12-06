<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceProvider extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceProviderFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'service_category_id',
        'starting_price',
        'city',
        'work_images',
        'bio',
        'availability',
        'rating',
        'rating_count',
    ];

    protected $casts = [
        'work_images' => 'array',
        'starting_price' => 'decimal:2',
        'rating' => 'decimal:2',
        'rating_count' => 'integer',
    ];

    /**
     * Get the user who owns this service provider profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the service category this provider belongs to
     */
    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'service_category_id');
    }

    /**
     * Scope to get only available service providers
     */
    public function scopeAvailable($query)
    {
        return $query->where('availability', 'available');
    }

    /**
     * Scope to filter by city
     */
    public function scopeInCity($query, string $city)
    {
        return $query->where('city', $city);
    }

    /**
     * Scope to order by rating
     */
    public function scopeOrderByRating($query, string $direction = 'desc')
    {
        return $query->orderBy('rating', $direction);
    }
}
