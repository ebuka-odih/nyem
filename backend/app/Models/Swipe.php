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
        'target_item_id',
        'direction',
    ];

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function targetItem()
    {
        return $this->belongsTo(Item::class, 'target_item_id');
    }
}
