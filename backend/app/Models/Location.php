<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'film_id',
        'name',
        'address',
        'gps_lat',
        'gps_lng',
        'photos',
        'permit_status',
        'permit_document',
        'contact_name',
        'contact_phone',
        'parking_info',
        'facilities_notes',
    ];

    protected $casts = [
        'photos' => 'array',
        'gps_lat' => 'float',
        'gps_lng' => 'float',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function scenes()
    {
        return $this->hasMany(Scene::class);
    }
}
