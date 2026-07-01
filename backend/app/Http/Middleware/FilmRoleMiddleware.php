<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilmRoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: film.role:permission1,permission2 or film.role:role1,role2
     * Prefix with "perm:" to check permissions, otherwise checks roles.
     */
    public function handle(Request $request, Closure $next, ...$checks): Response
    {
        $filmUser = $request->attributes->get('film_user');

        if (!$filmUser) {
            return response()->json(['message' => 'Unauthorized. Film context not found.'], 403);
        }

        if (empty($checks)) {
            return $next($request);
        }

        // Super Admin bypass
        if ($request->user() && $request->user()->is_super_admin) {
            return $next($request);
        }

        // Film Admin bypass (is_admin role)
        if ($filmUser->isFilmAdmin()) {
            return $next($request);
        }

        // Check if this is a permission check (prefixed with "perm:")
        $isPermissionCheck = false;
        foreach ($checks as $check) {
            if (str_starts_with($check, 'perm:')) {
                $isPermissionCheck = true;
                break;
            }
        }

        if ($isPermissionCheck) {
            $permissions = array_map(function ($c) {
                return str_starts_with($c, 'perm:') ? substr($c, 5) : $c;
            }, $checks);

            foreach ($permissions as $permission) {
                if ($filmUser->hasPermission($permission)) {
                    return $next($request);
                }
            }

            return response()->json(['message' => 'Unauthorized. Missing required permission.'], 403);
        }

        // Legacy role-based check
        if (!in_array($filmUser->role, $checks)) {
            return response()->json(['message' => 'Unauthorized. You do not have the required role.'], 403);
        }

        return $next($request);
    }
}
