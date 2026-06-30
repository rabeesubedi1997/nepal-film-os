<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScriptBreakdown extends Model
{
    protected $fillable = [
        'scene_id',
        'film_id',
        'cast_ids',
        'props',
        'wardrobe',
        'sfx',
        'vehicles',
        'extras_count',
        'revision_number',
        'version_color',
    ];

    protected $casts = [
        'cast_ids' => 'array',
        'props' => 'array',
        'wardrobe' => 'array',
        'sfx' => 'array',
        'vehicles' => 'array',
    ];

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }

    public function film()
    {
        return $this->belongsTo(Film::class);
    }
}
