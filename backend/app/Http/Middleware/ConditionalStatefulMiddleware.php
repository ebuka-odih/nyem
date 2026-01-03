<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpFoundation\Response;

/**
 * Conditionally apply EnsureFrontendRequestsAreStateful middleware
 * Only for requests from stateful domains (localhost, etc.)
 * For production/cross-domain APIs, skip CSRF and use token-based auth only
 */
class ConditionalStatefulMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
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
        $normalizedRequestHost = trim($requestHost ?? '');
        
        // Only apply stateful middleware if request is from a stateful domain
        if ($requestHost && in_array($normalizedRequestHost, $normalizedStatefulDomains, true)) {
            // Apply the EnsureFrontendRequestsAreStateful middleware
            // Use app() to resolve the middleware so it gets proper dependency injection
            $statefulMiddleware = app(EnsureFrontendRequestsAreStateful::class);
            return $statefulMiddleware->handle($request, $next);
        }
        
        // For non-stateful requests, skip CSRF and proceed with token-based auth
        return $next($request);
    }
}

