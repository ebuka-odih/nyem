<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Item extends Model
{
    /** @use HasFactory<\Database\Factories\ItemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'condition',
        'photos',
        'looking_for',
        'city',
        'status',
        'type',
        'price',
    ];

    protected $casts = [
        'photos' => 'array',
        'price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function swipes()
    {
        return $this->hasMany(Swipe::class, 'target_item_id');
    }
}
