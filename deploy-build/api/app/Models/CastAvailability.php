<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CastAvailability extends Model
{
    protected $table = 'cast_availability';

    protected $fillable = [
        'cast_crew_id',
        'film_id',
        'shoot_date',
        'status',
    ];

    protected $casts = [
        'shoot_date' => 'date',
    ];

    public function castCrew()
    {
        return $this->belongsTo(CastCrew::class);
    }

    public function film()
    {
        return $this->belongsTo(Film::class);
    }
}
