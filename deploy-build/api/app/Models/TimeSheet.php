<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSheet extends Model
{
    protected $table = 'time_sheets';

    protected $fillable = [
        'film_id',
        'user_id',
        'shoot_date',
        'check_in',
        'check_out',
        'break_minutes',
        'total_hours',
        'overtime_hours',
        'notes',
        'approved_by',
        'status',
        'rejection_reason',
        'submitted_at',
        'approved_at',
    ];

    protected $casts = [
        'shoot_date' => 'date',
        'break_minutes' => 'integer',
        'total_hours' => 'float',
        'overtime_hours' => 'float',
        'status' => 'string',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
