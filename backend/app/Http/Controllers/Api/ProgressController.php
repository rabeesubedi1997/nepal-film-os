<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgressUpdate;
use App\Models\Scene;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    /**
     * Get all progress updates for a film.
     */
    public function index(Request $request, $filmId)
    {
        $updates = ProgressUpdate::where('film_id', $filmId)
            ->with(['scene', 'schedule', 'reporter'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($updates);
    }

    /**
     * Update a progress update.
     */
    public function update(Request $request, $filmId, $id)
    {
        $update = ProgressUpdate::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'scene_id' => 'nullable|integer|exists:scenes,id',
            'schedule_id' => 'nullable|integer|exists:schedules,id',
            'status' => 'nullable|string|in:Not Started,In Progress,Completed,Postponed',
            'notes' => 'nullable|string',
            'media_files' => 'nullable|array',
            'scenes_completed' => 'nullable|boolean',
            'pages_completed' => 'nullable|numeric',
        ]);

        $update->update($validated);

        return response()->json($update->load(['scene', 'schedule', 'reporter']));
    }

    /**
     * Delete a progress update.
     */
    public function destroy(Request $request, $filmId, $id)
    {
        $update = ProgressUpdate::where('film_id', $filmId)->findOrFail($id);
        $update->delete();

        return response()->json(['message' => 'Progress update deleted successfully.']);
    }

    /**
     * Store a progress update and update scene/schedule status.
     */
    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'scene_id' => 'required|integer|exists:scenes,id',
            'schedule_id' => 'required|integer|exists:schedules,id',
            'status' => 'required|string|in:Not Started,In Progress,Completed,Postponed',
            'notes' => 'nullable|string',
            'media_files' => 'nullable|array',
            'media_files.*' => 'string', // URLs or base64 data
            'scenes_completed' => 'required|boolean',
            'pages_completed' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $filmId, $request) {
            $user = $request->user();

            $update = ProgressUpdate::create([
                'film_id' => $filmId,
                'scene_id' => $validated['scene_id'],
                'schedule_id' => $validated['schedule_id'],
                'status' => $validated['status'],
                'media_files' => $validated['media_files'] ?? [],
                'notes' => $validated['notes'] ?? null,
                'reported_by' => $user->id,
                'scenes_completed' => $validated['scenes_completed'],
                'pages_completed' => $validated['pages_completed'],
            ]);

            // Update respective scene status
            $scene = Scene::where('film_id', $filmId)->findOrFail($validated['scene_id']);
            $scene->update([
                'status' => $validated['status']
            ]);

            // If it is completed, update schedule status too if all scenes on it are done
            $schedule = Schedule::where('film_id', $filmId)->findOrFail($validated['schedule_id']);
            
            // Check scene status count on this schedule
            // For now, update schedule to "In Progress" if scene is In Progress, etc.
            if ($validated['status'] === 'In Progress') {
                $schedule->update(['status' => 'In Progress']);
            }

            return response()->json($update->load(['scene', 'schedule', 'reporter']), 201);
        });
    }
}
