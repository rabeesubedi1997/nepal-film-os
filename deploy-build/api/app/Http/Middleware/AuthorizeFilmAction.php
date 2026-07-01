<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeFilmAction
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    public function handle(Request $request, Closure $next, string $permission, ?string $module = null): Response
    {
        $film = $request->attributes->get('film');
        $user = $request->user();

        if (!$film) {
            return response()->json(['message' => 'No film context.'], 400);
        }

        $this->permissionService->requireCan($request, $film, $permission, $module);

        return $next($request);
    }
}
