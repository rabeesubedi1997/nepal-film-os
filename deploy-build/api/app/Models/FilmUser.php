<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmUser extends Model
{
    protected $table = 'film_users';

    protected $fillable = [
        'film_id',
        'user_id',
        'role',
        'department',
        'permissions',
        'is_active',
        'joined_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
