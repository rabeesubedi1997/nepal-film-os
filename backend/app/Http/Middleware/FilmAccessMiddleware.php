<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Film;
use App\Models\FilmUser;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilmAccessMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $filmParam = $request->route('film');

        if (!$filmParam) {
            return response()->json(['message' => 'Film parameter missing.'], 400);
        }

        // Support slug or ID
        $film = is_numeric($filmParam)
            ? Film::find($filmParam)
            : Film::where('slug', $filmParam)->first();

        if (!$film || !$film->is_active) {
            return response()->json(['message' => 'Film workspace not found or inactive.'], 404);
        }

        // Check if user is associated with this film
        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$filmUser) {
            return response()->json(['message' => 'Unauthorized. You do not have access to this film.'], 403);
        }

        // Attach film and role info to the request attributes
        $request->attributes->set('film', $film);
        $request->attributes->set('film_user', $filmUser);

        return $next($request);
    }
}
