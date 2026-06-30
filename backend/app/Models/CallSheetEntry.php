<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallSheetEntry extends Model
{
    protected $table = 'call_sheet_entries';

    protected $fillable = [
        'call_sheet_id',
        'cast_crew_id',
        'call_time',
        'scenes_today',
        'notes',
        'is_acknowledged',
        'acknowledged_at',
    ];

    protected $casts = [
        'scenes_today' => 'array',
        'is_acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    public function callSheet()
    {
        return $this->belongsTo(CallSheet::class);
    }

    public function castCrew()
    {
        return $this->belongsTo(CastCrew::class);
    }
}
