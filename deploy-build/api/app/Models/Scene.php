<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Scene extends Model
{
    protected $fillable = [
        'film_id',
        'script_id',
        'scene_number',
        'scene_heading',
        'int_ext',
        'location_id',
        'day_or_night',
        'page_count',
        'summary',
        'status',
        'order_index',
    ];

    protected $casts = [
        'page_count' => 'float',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function schedules()
    {
        return $this->belongsToMany(Schedule::class, 'scene_schedule')
                    ->withPivot('order_index')
                    ->withTimestamps();
    }

    public function progressUpdates()
    {
        return $this->hasMany(ProgressUpdate::class);
    }

    public function script()
    {
        return $this->belongsTo(Script::class);
    }
}
