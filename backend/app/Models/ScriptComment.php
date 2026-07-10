<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScriptComment extends Model
{
    protected $fillable = [
        'film_id',
        'script_id',
        'user_id',
        'parent_id',
        'content',
        'element_selector',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function script()
    {
        return $this->belongsTo(Script::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
