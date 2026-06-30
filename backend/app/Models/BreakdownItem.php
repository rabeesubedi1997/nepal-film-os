<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BreakdownItem extends Model
{
    protected $fillable = [
        'scene_id', 'film_id', 'category', 'item_name', 'quantity', 'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
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
