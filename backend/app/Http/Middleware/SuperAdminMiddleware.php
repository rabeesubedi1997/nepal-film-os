<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\FilmUser;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $isSuperAdmin = FilmUser::where('user_id', $user->id)
            ->where('role', 'Super Admin')
            ->where('is_active', true)
            ->exists();

        if (!$isSuperAdmin) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        return $next($request);
    }
}
