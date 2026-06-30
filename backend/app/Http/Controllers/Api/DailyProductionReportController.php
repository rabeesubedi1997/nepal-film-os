<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyProductionReport;
use Illuminate\Http\Request;

class DailyProductionReportController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $reports = DailyProductionReport::where('film_id', $filmId)
            ->with('schedule')
            ->orderBy('report_date', 'desc')
            ->get();

        return response()->json($reports);
    }

    public function show(Request $request, $filmId, $id)
    {
        $report = DailyProductionReport::where('film_id', $filmId)
            ->with('schedule')
            ->findOrFail($id);

        return response()->json($report);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'report_date' => 'required|date',
            'scenes_scheduled' => 'nullable|integer',
            'scenes_completed' => 'nullable|integer',
            'pages_scheduled' => 'nullable|numeric',
            'pages_completed' => 'nullable|numeric',
            'crew_count' => 'nullable|integer',
            'total_hours' => 'nullable|numeric',
            'daily_expenses' => 'nullable|numeric',
            'notes_director' => 'nullable|string',
            'notes_pm' => 'nullable|string',
            'sent_to' => 'nullable|array',
        ]);

        $report = DailyProductionReport::create([
            'film_id' => $filmId,
            'schedule_id' => $validated['schedule_id'],
            'report_date' => $validated['report_date'],
            'scenes_scheduled' => $validated['scenes_scheduled'] ?? 0,
            'scenes_completed' => $validated['scenes_completed'] ?? 0,
            'pages_scheduled' => $validated['pages_scheduled'] ?? 0,
            'pages_completed' => $validated['pages_completed'] ?? 0,
            'crew_count' => $validated['crew_count'] ?? 0,
            'total_hours' => $validated['total_hours'] ?? 0,
            'daily_expenses' => $validated['daily_expenses'] ?? 0,
            'notes_director' => $validated['notes_director'] ?? null,
            'notes_pm' => $validated['notes_pm'] ?? null,
            'sent_to' => $validated['sent_to'] ?? [],
        ]);

        return response()->json($report->load('schedule'), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $report = DailyProductionReport::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'scenes_scheduled' => 'nullable|integer',
            'scenes_completed' => 'nullable|integer',
            'pages_scheduled' => 'nullable|numeric',
            'pages_completed' => 'nullable|numeric',
            'crew_count' => 'nullable|integer',
            'total_hours' => 'nullable|numeric',
            'daily_expenses' => 'nullable|numeric',
            'notes_director' => 'nullable|string',
            'notes_pm' => 'nullable|string',
        ]);

        $report->update($validated);

        return response()->json($report->load('schedule'));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $report = DailyProductionReport::where('film_id', $filmId)->findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'DPR deleted.']);
    }
}
