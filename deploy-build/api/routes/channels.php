<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('scripts.{filmId}', function ($user, $filmId) {
    return $user->films()->where('film_id', $filmId)->exists();
});
