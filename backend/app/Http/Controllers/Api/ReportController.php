<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\Schedule;
use App\Models\Scene;
use App\Models\CallSheet;
use App\Models\CastCrew;
use App\Models\Expense;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summary($filmId)
    {
        $film = Film::findOrFail($filmId);

        $totalShootDays = Schedule::where('film_id', $filmId)->count();
        $completedShootDays = Schedule::where('film_id', $filmId)->where('status', 'Completed')->count();
        $totalScenes = Scene::where('film_id', $filmId)->count();
        $completedScenes = Scene::where('film_id', $filmId)->where('status', 'Completed')->count();
        $totalCastCrew = CastCrew::where('film_id', $filmId)->count();
        $totalCallSheets = CallSheet::where('film_id', $filmId)->count();
        $totalBudget = Expense::where('film_id', $filmId)->sum('amount');

        return response()->json([
            'total_shoot_days' => $totalShootDays,
            'completed_shoot_days' => $completedShootDays,
            'shoot_day_completion' => $totalShootDays > 0 ? round(($completedShootDays / $totalShootDays) * 100) : 0,
            'total_scenes' => $totalScenes,
            'completed_scenes' => $completedScenes,
            'scene_completion' => $totalScenes > 0 ? round(($completedScenes / $totalScenes) * 100) : 0,
            'total_cast_crew' => $totalCastCrew,
            'total_call_sheets' => $totalCallSheets,
            'total_expenses' => round($totalBudget, 2),
        ]);
    }
}
