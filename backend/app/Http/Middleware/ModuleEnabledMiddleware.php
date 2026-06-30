<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\FilmModule;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ModuleEnabledMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $moduleName): Response
    {
        $film = $request->attributes->get('film');

        if (!$film) {
            return response()->json(['message' => 'Unauthorized. Film context not found.'], 403);
        }

        // Check if module is enabled
        $isEnabled = FilmModule::where('film_id', $film->id)
            ->where('module_name', $moduleName)
            ->where('is_enabled', true)
            ->exists();

        if (!$isEnabled) {
            return response()->json(['message' => "The module '{$moduleName}' is disabled for this film."], 403);
        }

        return $next($request);
    }
}
