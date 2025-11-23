<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OtpCode extends Model
{
    /** @use HasFactory<\Database\Factories\OtpCodeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'phone',
        'code',
        'expires_at',
        'consumed',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed' => 'boolean',
    ];

    public function isValidFor(string $phone, string $code): bool
    {
        return $this->phone === $phone
            && $this->code === $code
            && ! $this->consumed
            && $this->expires_at->isFuture();
    }
}
