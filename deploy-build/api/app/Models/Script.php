<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Script extends Model
{
    protected $fillable = [
        'film_id',
        'title',
        'content',
        'description',
        'created_by',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scenes()
    {
        return $this->hasMany(Scene::class);
    }
}
