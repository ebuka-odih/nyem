<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'phone',
        'username',
        'username_updated_at',
        'bio',
        'profile_photo',
        'city',
        'role',
        'otp_verified_at',
        'password',
    ];

    protected $hidden = [
        'remember_token',
        'password',
    ];

    protected function casts(): array
    {
        return [
            'otp_verified_at' => 'datetime',
            'username_updated_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function swipes()
    {
        return $this->hasMany(Swipe::class, 'from_user_id');
    }
}
