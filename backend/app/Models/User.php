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
        'email',
        'google_id',
        'username',
        'name',
        'username_updated_at',
        'bio',
        'profile_photo',
        'city',
        'city_id',
        'area_id',
        'is_artisan',
        'role',
        'otp_verified_at',
        'email_verified_at',
        'phone_verified_at',
        'password',
        'latitude',
        'longitude',
        'location_updated_at',
        'bank_name',
        'account_number',
        'account_name',
        'escrow_enabled',
        'onesignal_player_id',
    ];

    protected $hidden = [
        'remember_token',
        'password',
    ];

    protected function casts(): array
    {
        return [
            'otp_verified_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'username_updated_at' => 'datetime',
            'location_updated_at' => 'datetime',
            'password' => 'hashed',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_artisan' => 'boolean',
            'escrow_enabled' => 'boolean',
        ];
    }

    /**
     * Get all listings created by this user
     */
    public function listings()
    {
        return $this->hasMany(Listing::class);
    }

    /**
     * Get reviews received by this user (as a seller)
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'receiver_id');
    }

    /**
     * Get the service provider profile for this user (if artisan)
     */
    public function serviceProvider()
    {
        return $this->hasOne(ServiceProvider::class);
    }

    public function swipes()
    {
        return $this->hasMany(Swipe::class, 'from_user_id');
    }

    public function matchesAsUser1()
    {
        return $this->hasMany(UserMatch::class, 'user1_id');
    }

    public function matchesAsUser2()
    {
        return $this->hasMany(UserMatch::class, 'user2_id');
    }

    /**
     * Get the notification settings for this user
     */
    public function notificationSettings()
    {
        return $this->hasOne(UserNotificationSetting::class);
    }

    /**
     * Get transactions where user is the buyer
     */
    public function purchaseTransactions()
    {
        return $this->hasMany(Transaction::class, 'buyer_id');
    }

    /**
     * Get transactions where user is the seller
     */
    public function saleTransactions()
    {
        return $this->hasMany(Transaction::class, 'seller_id');
    }

    /**
     * Get the city location (belongsTo Location where type='city')
     */
    public function cityLocation()
    {
        return $this->belongsTo(Location::class, 'city_id');
    }

    /**
     * Get the area location (belongsTo Location where type='area')
     */
    public function areaLocation()
    {
        return $this->belongsTo(Location::class, 'area_id');
    }

    /**
     * Users who follow this user
     */
    public function followers()
    {
        return $this->hasMany(Follower::class, 'following_id');
    }

    /**
     * Users this user is following
     */
    public function following()
    {
        return $this->hasMany(Follower::class, 'follower_id');
    }

    /**
     * Get city name attribute (backward compatibility)
     * Uses cityLocation relationship if available, falls back to city string
     */
    public function getCityNameAttribute()
    {
        if ($this->relationLoaded('cityLocation') && $this->cityLocation) {
            return $this->cityLocation->name;
        }
        return $this->attributes['city'] ?? null;
    }

    /**
     * Get area name attribute
     */
    public function getAreaNameAttribute()
    {
        if ($this->relationLoaded('areaLocation') && $this->areaLocation) {
            return $this->areaLocation->name;
        }
        return null;
    }

    /**
     * Check if user has location data
     * 
     * @return bool
     */
    public function hasLocation(): bool
    {
        return !is_null($this->latitude) && !is_null($this->longitude);
    }

    /**
     * Scope to filter users with location data
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithLocation($query)
    {
        return $query->whereNotNull('latitude')
                    ->whereNotNull('longitude');
    }

    /**
     * Scope to find users within a radius (in kilometers) from given coordinates
     * Uses MySQL Haversine formula for accurate distance calculation
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param float $latitude Latitude of the center point
     * @param float $longitude Longitude of the center point
     * @param float $radiusKm Radius in kilometers
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithinRadius($query, float $latitude, float $longitude, float $radiusKm)
    {
        // Haversine formula in MySQL
        // 6371 is the Earth's radius in kilometers
        // Returns distance in kilometers
        $haversine = "(
            6371 * acos(
                cos(radians(?))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(?))
                + sin(radians(?))
                * sin(radians(latitude))
            )
        )";

        return $query->selectRaw(
            "*, {$haversine} AS distance",
            [$latitude, $longitude, $latitude]
        )
        ->having('distance', '<=', $radiusKm)
        ->orderBy('distance', 'asc');
    }

    /**
     * Scope to exclude specific user IDs (e.g., current user)
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array|string $userIds
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeExcludeUsers($query, $userIds)
    {
        $userIds = is_array($userIds) ? $userIds : [$userIds];
        return $query->whereNotIn('id', $userIds);
    }
}
