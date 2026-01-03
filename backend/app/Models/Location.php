<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type', // 'city' or 'area'
        'description',
        'parent_id', // For areas, this references the parent city
        'is_active',
        'is_popular',
        'sort_order',
        'order', // Keep for backward compatibility
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'sort_order' => 'integer',
        'order' => 'integer',
    ];

    /**
     * Get the children locations (areas for cities)
     */
    public function children()
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    /**
     * Get the parent location (city for areas)
     */
    public function parent()
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    /**
     * Get the areas in this location (for cities)
     */
    public function areas()
    {
        return $this->children()->where('type', 'area');
    }

    /**
     * Scope to get only cities
     */
    public function scopeCities(Builder $query)
    {
        return $query->where('type', 'city')->whereNull('parent_id');
    }

    /**
     * Scope to get only areas
     */
    public function scopeAreas(Builder $query)
    {
        return $query->where('type', 'area')->whereNotNull('parent_id');
    }

    /**
     * Scope to get active locations
     */
    public function scopeActive(Builder $query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered(Builder $query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get full path (City > Area)
     */
    public function getFullPathAttribute()
    {
        $parts = [];
        
        if ($this->type === 'area' && $this->parent) {
            $parts[] = $this->parent->name; // City
        }
        
        $parts[] = $this->name;
        
        return implode(' > ', $parts);
    }

    /**
     * Get breadcrumb
     */
    public function getBreadcrumbAttribute()
    {
        $breadcrumb = [];
        
        if ($this->type === 'area' && $this->parent) {
            $breadcrumb[] = [
                'name' => $this->parent->name,
                'slug' => $this->parent->slug,
                'type' => 'city'
            ];
        }
        
        $breadcrumb[] = [
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type
        ];
        
        return $breadcrumb;
    }
}
