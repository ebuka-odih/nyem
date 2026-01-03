<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Transaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'buy_request_id',
        'buyer_id',
        'seller_id',
        'listing_id',
        'amount',
        'type',
        'status',
        'payment_method',
        'funds_held_at',
        'delivery_confirmed_at',
        'auto_release_at',
        'released_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'funds_held_at' => 'datetime',
        'delivery_confirmed_at' => 'datetime',
        'auto_release_at' => 'datetime',
        'released_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function buyRequest()
    {
        return $this->belongsTo(BuyRequest::class, 'buy_request_id');
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class, 'listing_id');
    }
}
