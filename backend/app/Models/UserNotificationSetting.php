<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserNotificationSetting extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'push_enabled',
        'email_enabled',
        'sms_enabled',
        'trade_alerts',
        'message_alerts',
        'match_alerts',
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'email_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'trade_alerts' => 'boolean',
        'message_alerts' => 'boolean',
        'match_alerts' => 'boolean',
    ];

    /**
     * Get the user that owns the notification settings
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
