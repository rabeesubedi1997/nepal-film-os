<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated. Please log in again.'], 401);
        }

        if (!$user->is_super_admin) {
            return response()->json([
                'message' => 'Unauthorized. Super Admin access required.',
                'hint' => "User '{$user->email}' is not a super admin. Run: php artisan user:make-super-admin {$user->email}",
            ], 403);
        }

        return $next($request);
    }
}
