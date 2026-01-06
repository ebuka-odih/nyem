<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule cleanup of expired wishlist items (runs every hour)
Schedule::command('wishlist:cleanup-expired')
    ->hourly()
    ->withoutOverlapping();
