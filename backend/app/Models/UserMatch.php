<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserMatch extends Model
{
    /** @use HasFactory<\Database\Factories\UserMatchFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user1_id',
        'user2_id',
        'listing1_id',
        'listing2_id',
        'conversation_id',
    ];

    public function user1()
    {
        return $this->belongsTo(User::class, 'user1_id');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user2_id');
    }

    public function listing1()
    {
        return $this->belongsTo(Listing::class, 'listing1_id');
    }

    /**
     * Backward compatibility alias for listing1.
     */
    public function item1()
    {
        return $this->belongsTo(Listing::class, 'listing1_id');
    }

    public function listing2()
    {
        return $this->belongsTo(Listing::class, 'listing2_id');
    }

    /**
     * Backward compatibility alias for listing2.
     */
    public function item2()
    {
        return $this->belongsTo(Listing::class, 'listing2_id');
    }

    public function conversation()
    {
        return $this->belongsTo(UserConversation::class, 'conversation_id');
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user1_id', $userId)
                ->orWhere('user2_id', $userId);
        });
    }

    public function otherUserId(string $userId): string|null
    {
        if ($this->user1_id === $userId) {
            return $this->user2_id;
        }

        if ($this->user2_id === $userId) {
            return $this->user1_id;
        }

        return null;
    }
}
