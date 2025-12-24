<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ItemStat extends Model
{
    /** @use HasFactory<\Database\Factories\ItemStatFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'item_id',
        'user_id',
        'type',
        'ip_address',
        'user_agent',
        'swipe_id',
    ];

    /**
     * Get the item that this stat belongs to
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
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
