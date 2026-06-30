<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilmRoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $filmUser = $request->attributes->get('film_user');

        if (!$filmUser) {
            return response()->json(['message' => 'Unauthorized. Film context not found.'], 403);
        }

        // If roles is empty, allow access
        if (empty($roles)) {
            return $next($request);
        }

        // Super Admin gets access to everything
        if ($filmUser->role === 'Super Admin') {
            return $next($request);
        }

        if (!in_array($filmUser->role, $roles)) {
            return response()->json(['message' => 'Unauthorized. You do not have the required role.'], 403);
        }

        return $next($request);
    }
}
