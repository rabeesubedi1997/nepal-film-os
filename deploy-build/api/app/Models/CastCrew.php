<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CastCrew extends Model
{
    protected $table = 'cast_crew';

    protected $fillable = [
        'film_id',
        'user_id',
        'name',
        'photo',
        'role_type',
        'role_name',
        'department',
        'character_name',
        'contact_phone',
        'contact_email',
        'whatsapp',
        'emergency_contact_name',
        'emergency_contact_phone',
        'contract_status',
        'day_rates',
    ];

    protected $casts = [
        'day_rates' => 'float',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function callSheetEntries()
    {
        return $this->hasMany(CallSheetEntry::class);
    }
}
