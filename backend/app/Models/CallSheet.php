<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallSheet extends Model
{
    protected $table = 'call_sheets';

    protected $fillable = [
        'film_id',
        'schedule_id',
        'shoot_date',
        'general_call_time',
        'location_id',
        'catering_info',
        'weather',
        'emergency_info',
        'special_instructions',
        'is_sent',
        'sent_at',
        'created_by',
    ];

    protected $casts = [
        'shoot_date' => 'date',
        'is_sent' => 'boolean',
        'sent_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function entries()
    {
        return $this->hasMany(CallSheetEntry::class);
    }
}
