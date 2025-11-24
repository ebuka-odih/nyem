<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TradeOffer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'offered_item_id',
        'target_item_id',
        'status',
    ];

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function offeredItem()
    {
        return $this->belongsTo(Item::class, 'offered_item_id');
    }

    public function targetItem()
    {
        return $this->belongsTo(Item::class, 'target_item_id');
    }
}
