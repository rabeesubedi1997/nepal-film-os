<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\Schedule;
use App\Models\Scene;
use App\Models\CastCrew;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\CallSheet;
use App\Models\TimeSheet;
use App\Models\Task;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function overview($filmId)
    {
        $totalShootDays = Schedule::where('film_id', $filmId)->count();
        $completedDays = Schedule::where('film_id', $filmId)->where('status', 'Completed')->count();
        $totalScenes = Scene::where('film_id', $filmId)->count();
        $completedScenes = Scene::where('film_id', $filmId)->where('status', 'Completed')->count();
        $totalCastCrew = CastCrew::where('film_id', $filmId)->count();
        $totalCast = CastCrew::where('film_id', $filmId)->where('role_type', 'cast')->count();
        $totalCrew = CastCrew::where('film_id', $filmId)->where('role_type', 'crew')->count();
        $totalExpenses = Expense::where('film_id', $filmId)->sum('amount');
        $totalBudget = Budget::where('film_id', $filmId)->sum('budgeted_amount');
        $pendingExpenses = Expense::where('film_id', $filmId)->where('status', 'Pending')->count();
        $approvedExpenses = Expense::where('film_id', $filmId)->where('status', 'Approved')->count();

        return response()->json([
            'shoot_days' => ['total' => $totalShootDays, 'completed' => $completedDays, 'completion' => $totalShootDays > 0 ? round(($completedDays / $totalShootDays) * 100) : 0],
            'scenes' => ['total' => $totalScenes, 'completed' => $completedScenes, 'completion' => $totalScenes > 0 ? round(($completedScenes / $totalScenes) * 100) : 0],
            'crew' => ['total' => $totalCastCrew, 'cast' => $totalCast, 'crew' => $totalCrew],
            'budget' => ['budgeted' => round($totalBudget, 2), 'spent' => round($totalExpenses, 2), 'remaining' => round($totalBudget - $totalExpenses, 2), 'variance' => $totalBudget > 0 ? round(($totalExpenses / $totalBudget) * 100, 1) : 0],
            'expenses_pending' => $pendingExpenses,
            'expenses_approved' => $approvedExpenses,
        ]);
    }

    public function trends($filmId)
    {
        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $start = now()->subWeeks($i)->startOfWeek();
            $end = now()->subWeeks($i)->endOfWeek();
            $scheduled = Schedule::where('film_id', $filmId)->whereBetween('shoot_date', [$start, $end])->count();
            $completed = Schedule::where('film_id', $filmId)->whereBetween('shoot_date', [$start, $end])->where('status', 'Completed')->count();
            $weeks[] = [
                'week' => $start->format('M d'),
                'scheduled' => $scheduled,
                'completed' => $completed,
            ];
        }

        $departments = Budget::where('film_id', $filmId)
            ->selectRaw('department_id, SUM(budgeted_amount) as budgeted')
            ->groupBy('department_id')
            ->get();

        $deptActuals = [];
        foreach ($departments as $dept) {
            $spent = Expense::where('film_id', $filmId)->where('department_id', $dept->department_id)->sum('amount');
            $deptActuals[] = [
                'department' => $dept->department_id,
                'budgeted' => round($dept->budgeted, 2),
                'spent' => round($spent, 2),
            ];
        }

        $sceneStatuses = Scene::where('film_id', $filmId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $scheduleStatuses = Schedule::where('film_id', $filmId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'weekly_trends' => $weeks,
            'department_budget' => $deptActuals,
            'scene_statuses' => $sceneStatuses,
            'schedule_statuses' => $scheduleStatuses,
        ]);
    }

    public function forecasts($filmId)
    {
        $scenes = Scene::where('film_id', $filmId)->count();
        $completedScenes = Scene::where('film_id', $filmId)->where('status', 'Completed')->count();
        $shootDays = Schedule::where('film_id', $filmId)->count();
        $completedDays = Schedule::where('film_id', $filmId)->where('status', 'Completed')->count();

        $firstDate = Schedule::where('film_id', $filmId)->min('shoot_date');
        $lastDate = Schedule::where('film_id', $filmId)->max('shoot_date');
        $daysElapsed = $firstDate && $lastDate ? now()->diffInDays($firstDate) : 0;

        $sceneCompletionRate = $scenes > 0 ? ($completedScenes / $scenes) : 0;
        $dayCompletionRate = $shootDays > 0 ? ($completedDays / $shootDays) : 0;

        $remainingScenes = $scenes - $completedScenes;
        $estimatedDaysRemaining = $sceneCompletionRate > 0
            ? round($remainingScenes / ($completedScenes / max($daysElapsed, 1)))
            : 0;

        $budget = Budget::where('film_id', $filmId)->sum('budgeted_amount');
        $spent = Expense::where('film_id', $filmId)->sum('amount');
        $dailyBurnRate = $completedDays > 0 ? ($spent / $completedDays) : 0;
        $estimatedRemainingCost = round($dailyBurnRate * $estimatedDaysRemaining, 2);
        $projectedTotal = round($spent + $estimatedRemainingCost, 2);
        $budgetVariance = $budget > 0 ? round((($projectedTotal - $budget) / $budget) * 100, 1) : 0;

        return response()->json([
            'scene_completion_rate' => round($sceneCompletionRate * 100, 1),
            'day_completion_rate' => round($dayCompletionRate * 100, 1),
            'estimated_days_remaining' => max(0, $estimatedDaysRemaining),
            'daily_burn_rate' => round($dailyBurnRate, 2),
            'estimated_remaining_cost' => max(0, $estimatedRemainingCost),
            'projected_total_cost' => $projectedTotal,
            'budget_variance_percent' => $budgetVariance,
            'budget' => round($budget, 2),
            'spent' => round($spent, 2),
        ]);
    }
}
