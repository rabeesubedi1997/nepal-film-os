<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'film_id',
        'title',
        'description',
        'assigned_to',
        'due_date',
        'priority',
        'status',
        'related_module',
        'related_id',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
