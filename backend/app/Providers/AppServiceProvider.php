<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix MySQL key length issue with utf8mb4
        // 191 * 4 bytes = 764 bytes, which is under MySQL's 1000 byte limit
        Schema::defaultStringLength(191);
        
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    }
}
