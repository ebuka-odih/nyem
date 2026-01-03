<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*', // Exclude all API routes by default - they use token-based auth
    ];

    /**
     * Determine if the request should be excluded from CSRF verification.
     * 
     * For API routes, we exclude them from CSRF verification by default since
     * they should use token-based authentication. The EnsureFrontendRequestsAreStateful
     * middleware will handle enabling CSRF for stateful requests if needed.
     */
    protected function inExceptArray($request)
    {
        // Exclude all API routes from CSRF verification
        // API routes should use token-based authentication, not CSRF tokens
        if ($request->is('api/*')) {
            return true;
        }
        
        return parent::inExceptArray($request);
    }
}

