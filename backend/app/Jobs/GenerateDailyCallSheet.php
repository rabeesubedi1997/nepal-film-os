<?php

namespace App\Jobs;

use App\Models\Film;
use App\Models\Schedule;
use App\Models\CallSheet;
use App\Models\CallSheetEntry;
use App\Models\CastCrew;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateDailyCallSheet implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $today = now()->toDateString();

        $schedules = Schedule::where('shoot_date', $today)
            ->whereHas('film', fn($q) => $q->where('is_active', true))
            ->get();

        foreach ($schedules as $schedule) {
            $existingSheet = CallSheet::where('film_id', $schedule->film_id)
                ->where('schedule_id', $schedule->id)
                ->exists();

            if ($existingSheet) continue;

            $films = Film::whereHas('schedules', fn($q) => $q->where('shoot_date', $today));
            $castCrew = CastCrew::where('film_id', $schedule->film_id)->get();

            if ($castCrew->isEmpty()) continue;

            $callSheet = CallSheet::create([
                'film_id' => $schedule->film_id,
                'schedule_id' => $schedule->id,
                'shoot_date' => $schedule->shoot_date,
                'general_call_time' => $schedule->call_time ?? '06:00',
                'location_id' => $schedule->location_id,
                'is_sent' => false,
                'created_by' => $schedule->film->created_by,
            ]);

            foreach ($castCrew as $member) {
                CallSheetEntry::create([
                    'call_sheet_id' => $callSheet->id,
                    'cast_crew_id' => $member->id,
                    'call_time' => $callSheet->general_call_time,
                    'is_acknowledged' => false,
                ]);
            }
        }
    }
}
