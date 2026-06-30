<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WardrobeItem extends Model
{
    protected $table = 'wardrobe_items';

    protected $fillable = [
        'film_id',
        'character_name',
        'scene_id',
        'description',
        'continuity_photo',
        'status',
        'notes',
        'assigned_to',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function scene()
    {
        return $this->belongsTo(Scene::class);
    }
}
