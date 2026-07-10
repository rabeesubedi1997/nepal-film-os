<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BeatSheet extends Model
{
    protected $fillable = [
        'film_id',
        'title',
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

    public function beats()
    {
        return $this->hasMany(Beat::class)->orderBy('order_index');
    }
}
