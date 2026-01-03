<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ListingStat extends Model
{
    /** @use HasFactory<\Database\Factories\ListingStatFactory> */
    use HasFactory, HasUuids;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'listing_stats';

    protected $fillable = [
        'listing_id',
        'user_id',
        'type',
        'ip_address',
        'user_agent',
        'swipe_id',
    ];

    /**
     * Get the listing that this stat belongs to
     */
    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }

    /**
     * Get the user that performed this action (if authenticated)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the swipe that this like is associated with (if applicable)
     */
    public function swipe()
    {
        return $this->belongsTo(Swipe::class);
    }

    /**
     * Scope to filter by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
