<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'film_id',
        'day_number',
        'shoot_date',
        'status',
        'call_time',
        'wrap_time',
        'location_id',
        'notes',
    ];

    protected $casts = [
        'shoot_date' => 'date',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function scenes()
    {
        return $this->belongsToMany(Scene::class, 'scene_schedule')
                    ->withPivot('order_index')
                    ->withTimestamps();
    }

    public function callSheets()
    {
        return $this->hasMany(CallSheet::class);
    }
}
