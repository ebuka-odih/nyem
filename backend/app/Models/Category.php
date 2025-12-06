<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'type',
        'parent_id',
        'slug',
        'icon',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
        'parent_id' => 'integer',
    ];

    /**
     * Get the parent category (for sub-categories)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Get child categories (for main categories)
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Get all listings in this category
     */
    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    /**
     * Get all service providers in this category
     */
    public function serviceProviders(): HasMany
    {
        return $this->hasMany(ServiceProvider::class, 'service_category_id');
    }

    /**
     * Scope to get only main categories
     */
    public function scopeMain($query)
    {
        return $query->where('type', 'main');
    }

    /**
     * Scope to get only sub-categories
     */
    public function scopeSub($query)
    {
        return $query->where('type', 'sub');
    }

    /**
     * Scope to get sub-categories of a specific parent
     */
    public function scopeChildrenOf($query, $parentId)
    {
        return $query->where('parent_id', $parentId);
    }
}
