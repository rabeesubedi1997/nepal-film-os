<?php

namespace App\Http\Controllers\Api\Traits;

use App\Models\Film;
use App\Models\FilmUser;

trait FilmPermissionTrait
{
    protected function resolveFilm($filmId)
    {
        return is_numeric($filmId)
            ? Film::find($filmId)
            : Film::where('slug', $filmId)->first();
    }

    protected function getFilmUser($filmId, $userId)
    {
        $film = $this->resolveFilm($filmId);
        if (!$film) return null;

        return FilmUser::with('filmRole')
            ->where('film_id', $film->id)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }

    protected function userCan($request, $filmId, $permission)
    {
        if ($request->user() && $request->user()->is_super_admin) {
            return true;
        }

        $fu = $this->getFilmUser($filmId, $request->user()->id);

        if (!$fu) {
            return false;
        }

        if ($fu->isFilmAdmin()) {
            return true;
        }

        return $fu->hasPermission($permission);
    }

    protected function requireCan($request, $filmId, $permission)
    {
        if (!$this->userCan($request, $filmId, $permission)) {
            abort(403, "Missing permission: {$permission}");
        }
    }
}
