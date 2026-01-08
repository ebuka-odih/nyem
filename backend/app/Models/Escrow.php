<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Escrow extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'amount',
        'currency',
        'description',
        'payment_provider',
        'paystack_reference',
        'paystack_transfer_reference',
        'status',
        'seller_notified',
        'seller_acknowledged',
        'buyer_confirmed',
        'release_authorized',
        'finalized',
        'auto_released',
        'dispute_reason',
        'completion_note',
        'locked_at',
        'acknowledged_at',
        'completed_at',
        'confirmed_at',
        'authorized_at',
        'released_at',
        'resolved_at',
        'dispute_opened_at',
        'cancelled_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'seller_notified' => 'boolean',
        'seller_acknowledged' => 'boolean',
        'buyer_confirmed' => 'boolean',
        'release_authorized' => 'boolean',
        'finalized' => 'boolean',
        'auto_released' => 'boolean',
        'locked_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'completed_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'authorized_at' => 'datetime',
        'released_at' => 'datetime',
        'resolved_at' => 'datetime',
        'dispute_opened_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
