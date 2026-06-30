<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyProductionReport extends Model
{
    protected $table = 'daily_production_reports';

    protected $fillable = [
        'film_id',
        'schedule_id',
        'report_date',
        'scenes_scheduled',
        'scenes_completed',
        'pages_scheduled',
        'pages_completed',
        'crew_count',
        'total_hours',
        'daily_expenses',
        'notes_director',
        'notes_pm',
        'generated_at',
        'sent_to',
    ];

    protected $casts = [
        'report_date' => 'date',
        'scenes_scheduled' => 'integer',
        'scenes_completed' => 'integer',
        'sent_to' => 'array',
        'generated_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }
}
