<?php

namespace App\Services;

use App\Models\DailyProductionReport;
use App\Models\Schedule;
use App\Models\Scene;
use App\Models\Expense;
use App\Models\TimeSheet;
use App\Models\ProgressUpdate;

class DPRService
{
    public function generateForSchedule(Schedule $schedule)
    {
        $filmId = $schedule->film_id;

        $scenesOnDay = $schedule->scenes;
        $scenesScheduled = $scenesOnDay->count();
        $scenesCompleted = $scenesOnDay->where('status', 'Completed')->count();
        $pagesScheduled = $scenesOnDay->sum('page_count');
        $pagesCompleted = $scenesOnDay->where('status', 'Completed')->sum('page_count');

        $progressUpdates = ProgressUpdate::where('film_id', $filmId)
            ->where('schedule_id', $schedule->id)
            ->whereDate('created_at', $schedule->shoot_date)
            ->get();
        $actualPagesCompleted = $progressUpdates->sum('pages_completed');

        $timeSheets = TimeSheet::where('film_id', $filmId)
            ->where('shoot_date', $schedule->shoot_date)
            ->get();
        $crewCount = $timeSheets->count();
        $totalHours = $timeSheets->sum('total_hours');

        $dailyExpenses = Expense::where('film_id', $filmId)
            ->whereDate('date', $schedule->shoot_date)
            ->sum('amount');

        $report = DailyProductionReport::create([
            'film_id' => $filmId,
            'schedule_id' => $schedule->id,
            'report_date' => $schedule->shoot_date,
            'scenes_scheduled' => $scenesScheduled,
            'scenes_completed' => $scenesCompleted,
            'pages_scheduled' => $pagesScheduled,
            'pages_completed' => $actualPagesCompleted ?: $pagesCompleted,
            'crew_count' => $crewCount,
            'total_hours' => $totalHours,
            'daily_expenses' => $dailyExpenses,
        ]);

        return $report->load('schedule');
    }
}
