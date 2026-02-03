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
        'email',
        'code',
        'pin_id',
        'provider',
        'expires_at',
        'consumed',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed' => 'boolean',
    ];

    /**
     * Check if OTP is valid for a given phone number
     */
    public function isValidForPhone(string $phone, string $code): bool
    {
        return $this->phone === $phone
            && $this->code === $code
            && ! $this->consumed
            && $this->expires_at->isFuture();
    }

    /**
     * Check if OTP is valid for a given email
     */
    public function isValidForEmail(string $email, string $code): bool
    {
        return $this->email === $email
            && $this->code === $code
            && ! $this->consumed
            && $this->expires_at->isFuture();
    }

    /**
     * Check if OTP is valid for a given identifier (phone or email)
     * Maintains backward compatibility
     */
    public function isValidFor(string $identifier, string $code): bool
    {
        if ($this->phone && $this->phone === $identifier) {
            return $this->isValidForPhone($identifier, $code);
        }
        
        if ($this->email && $this->email === $identifier) {
            return $this->isValidForEmail($identifier, $code);
        }
        
        return false;
    }
}
