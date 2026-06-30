<?php

namespace App\Services;

use App\Models\CallSheet;
use App\Models\DailyProductionReport;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\Scene;
use App\Models\Schedule;
use App\Models\Location;
use App\Models\ShotList;
use Barryvdh\DomPDF\Facade\Pdf;

class PDFExportService
{
    public function callSheet(CallSheet $callSheet)
    {
        $pdf = Pdf::loadView('pdfs.call-sheet', [
            'callSheet' => $callSheet->load(['schedule.scenes', 'location', 'entries.castCrew', 'creator']),
        ]);
        return $pdf->download("call-sheet-{$callSheet->shoot_date}.pdf");
    }

    public function schedule(Schedule $schedule)
    {
        $pdf = Pdf::loadView('pdfs.schedule', [
            'schedule' => $schedule->load(['scenes', 'location']),
        ]);
        return $pdf->download("schedule-day-{$schedule->day_number}.pdf");
    }

    public function shotList($filmId)
    {
        $shots = ShotList::where('film_id', $filmId)->with('scene')->orderBy('scene_id')->get();
        $pdf = Pdf::loadView('pdfs.shot-list', ['shots' => $shots]);
        return $pdf->download('shot-list.pdf');
    }

    public function dpr(DailyProductionReport $report)
    {
        $pdf = Pdf::loadView('pdfs.dpr', [
            'report' => $report->load('schedule'),
        ]);
        return $pdf->download("dpr-{$report->report_date}.pdf");
    }

    public function expenseReport($filmId)
    {
        $expenses = Expense::where('film_id', $filmId)->with('submitter')->orderBy('date', 'desc')->get();
        $budgets = Budget::where('film_id', $filmId)->get();
        $pdf = Pdf::loadView('pdfs.expense-report', ['expenses' => $expenses, 'budgets' => $budgets]);
        return $pdf->download('expense-report.pdf');
    }

    public function budgetVsActual($filmId)
    {
        $budgets = Budget::where('film_id', $filmId)->get();
        $expenses = Expense::where('film_id', $filmId)->get();
        $pdf = Pdf::loadView('pdfs.budget-vs-actual', ['budgets' => $budgets, 'expenses' => $expenses]);
        return $pdf->download('budget-vs-actual.pdf');
    }

    public function sceneList($filmId)
    {
        $scenes = Scene::where('film_id', $filmId)->with('location')->orderBy('order_index')->get();
        $pdf = Pdf::loadView('pdfs.scene-list', ['scenes' => $scenes]);
        return $pdf->download('scene-list.pdf');
    }

    public function locationList($filmId)
    {
        $locations = Location::where('film_id', $filmId)->get();
        $pdf = Pdf::loadView('pdfs.location-list', ['locations' => $locations]);
        return $pdf->download('location-list.pdf');
    }
}
