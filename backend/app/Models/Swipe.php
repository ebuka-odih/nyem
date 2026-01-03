<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Swipe extends Model
{
    /** @use HasFactory<\Database\Factories\SwipeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'from_user_id',
        'target_listing_id',
        'offered_listing_id',
        'direction',
    ];

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function targetListing()
    {
        return $this->belongsTo(Listing::class, 'target_listing_id');
    }

    public function offeredListing()
    {
        return $this->belongsTo(Listing::class, 'offered_listing_id');
    }
}
