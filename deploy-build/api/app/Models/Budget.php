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
        // decimal:2, not float — the column is DECIMAL(15,2); casting to
        // PHP float reintroduces IEEE-754 rounding error for money.
        'budgeted_amount' => 'decimal:2',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }
}
