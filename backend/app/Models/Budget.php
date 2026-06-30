<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = [
        'film_id',
        'department_id',
        'category',
        'budgeted_amount',
        'currency',
    ];

    protected $casts = [
        'budgeted_amount' => 'float',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }
}
