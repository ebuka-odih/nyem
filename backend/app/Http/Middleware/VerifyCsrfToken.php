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
        //
    ];

    /**
     * Determine if the request should be excluded from CSRF verification.
     * 
     * For API routes, we only apply CSRF protection if the request is from
     * a stateful domain (as configured in Sanctum). Non-stateful API requests
     * should use token-based authentication only.
     */
    protected function inExceptArray($request)
    {
        // If this is an API route, check if it's from a stateful domain
        if ($request->is('api/*')) {
            // Get the stateful domains from Sanctum config
            $statefulDomains = Config::get('sanctum.stateful', []);
            
            // Get the request origin/referer
            $origin = $request->header('Origin');
            $referer = $request->header('Referer');
            
            // Extract host from origin or referer
            $requestHost = null;
            if ($origin) {
                $parsed = parse_url($origin);
                $requestHost = $parsed['host'] ?? null;
                if (isset($parsed['port'])) {
                    $requestHost .= ':' . $parsed['port'];
                }
            } elseif ($referer) {
                $parsed = parse_url($referer);
                $requestHost = $parsed['host'] ?? null;
                if (isset($parsed['port'])) {
                    $requestHost .= ':' . $parsed['port'];
                }
            }
            
            // Also check the request host directly (for same-origin requests)
            if (!$requestHost) {
                $requestHost = $request->getHost();
                if ($request->getPort()) {
                    $requestHost .= ':' . $request->getPort();
                }
            }
            
            // Normalize stateful domains (remove protocol, paths, etc.)
            $normalizedStatefulDomains = array_map(function ($domain) {
                // Remove protocol if present
                $domain = preg_replace('#^https?://#', '', $domain);
                // Remove path if present
                $domain = explode('/', $domain)[0];
                return trim($domain);
            }, $statefulDomains);
            
            // Normalize request host
            $normalizedRequestHost = trim($requestHost);
            
            // If we can't determine the origin, or it's not in the stateful domains list,
            // exclude from CSRF verification (use token-based auth)
            if (!$requestHost || !in_array($normalizedRequestHost, $normalizedStatefulDomains, true)) {
                return true; // Exclude from CSRF verification
            }
        }
        
        return parent::inExceptArray($request);
    }
}

