<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressUpdate extends Model
{
    protected $table = 'progress_updates';

    protected $fillable = [
        'film_id',
        'scene_id',
        'schedule_id',
        'status',
        'media_files',
        'notes',
        'reported_by',
        'scenes_completed',
        'pages_completed',
    ];

    protected $casts = [
        'media_files' => 'array',
        'scenes_completed' => 'boolean',
        'pages_completed' => 'float',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
