<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShotList extends Model
{
    protected $table = 'shot_lists';

    protected $fillable = [
        'scene_id',
        'film_id',
        'shot_number',
        'shot_type',
        'camera_angle',
        'lens_mm',
        'movement',
        'description',
        'storyboard_image',
        'duration_seconds',
        'status',
        'created_by',
    ];

    protected $casts = [
        'lens_mm' => 'integer',
        'duration_seconds' => 'integer',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
