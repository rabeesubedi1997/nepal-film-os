<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmModule extends Model
{
    protected $table = 'film_modules';

    protected $fillable = [
        'film_id',
        'module_name',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }
}
