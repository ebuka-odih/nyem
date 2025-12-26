<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BuyRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'item_id',
        'price',
        'location',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'buy_request_id');
    }
}
