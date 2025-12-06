<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Listing extends Model
{
    /** @use HasFactory<\Database\Factories\ListingFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'category_id',
        'type',
        'title',
        'description',
        'price',
        'location',
        'images',
        'condition',
        'status',
    ];

    protected $casts = [
        'images' => 'array',
        'price' => 'decimal:2',
    ];

    /**
     * Get the user who owns this listing
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category this listing belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Scope to get only shop listings
     */
    public function scopeShop($query)
    {
        return $query->where('type', 'shop');
    }

    /**
     * Scope to get only swap listings
     */
    public function scopeSwap($query)
    {
        return $query->where('type', 'swap');
    }

    /**
     * Scope to get only active listings
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
