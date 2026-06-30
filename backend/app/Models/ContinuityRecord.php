<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContinuityRecord extends Model
{
    protected $table = 'continuity_records';

    protected $fillable = [
        'scene_id',
        'film_id',
        'type',
        'continuity_photo',
        'notes',
        'captured_by',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function capturedBy()
    {
        return $this->belongsTo(User::class, 'captured_by');
    }
}
