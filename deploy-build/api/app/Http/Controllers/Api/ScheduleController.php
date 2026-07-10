<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Schedule;
use App\Models\Scene;
use App\Models\Location;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ScheduleController extends Controller
{
    use FilmPermissionTrait;
    /**
     * Get schedules, scenes, and locations for a film.
     */
    public function index(Request $request, $filmId)
    {
        $schedules = Schedule::where('film_id', $filmId)
            ->with(['scenes', 'location'])
            ->orderBy('day_number', 'asc')
            ->get();

        $scenes = Scene::where('film_id', $filmId)
            ->with('location')
            ->orderBy('order_index', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $locations = Location::where('film_id', $filmId)->get();

        return response()->json([
            'schedules' => $schedules,
            'scenes' => $scenes,
            'locations' => $locations,
        ]);
    }

    /**
     * Create a new schedule day.
     */
    public function storeSchedule(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'schedule.create');
        $validated = $request->validate([
            'day_number' => 'required|integer',
            'shoot_date' => 'required|date',
            'status' => 'nullable|string',
            'call_time' => 'nullable|string',
            'wrap_time' => 'nullable|string',
            'location_id' => 'nullable|integer|exists:locations,id',
            'notes' => 'nullable|string',
        ]);

        $schedule = Schedule::create([
            'film_id' => $filmId,
            'day_number' => $validated['day_number'],
            'shoot_date' => $validated['shoot_date'],
            'status' => $validated['status'] ?? 'Scheduled',
            'call_time' => $validated['call_time'] ?? null,
            'wrap_time' => $validated['wrap_time'] ?? null,
            'location_id' => $validated['location_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($schedule, 201);
    }

    /**
     * Create a new scene.
     */
    public function storeScene(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'scene.create');
        $validated = $request->validate([
            'scene_number' => 'required|string',
            'scene_heading' => 'required|string',
            'int_ext' => 'nullable|string|in:INT,EXT,INT/EXT',
            'location_id' => 'nullable|integer|exists:locations,id',
            'day_or_night' => 'nullable|string|in:DAY,NIGHT,DAWN,DUS',
            'page_count' => 'nullable|numeric',
            'summary' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $maxOrder = Scene::where('film_id', $filmId)->max('order_index') ?? 0;

        $scene = Scene::create([
            'film_id' => $filmId,
            'scene_number' => $validated['scene_number'],
            'scene_heading' => $validated['scene_heading'],
            'int_ext' => $validated['int_ext'] ?? 'INT',
            'location_id' => $validated['location_id'] ?? null,
            'day_or_night' => $validated['day_or_night'] ?? 'DAY',
            'page_count' => $validated['page_count'] ?? 1.00,
            'summary' => $validated['summary'] ?? null,
            'status' => $validated['status'] ?? 'Not Started',
            'order_index' => $maxOrder + 1,
        ]);

        return response()->json($scene, 201);
    }

    /**
     * Update a scene's properties or status.
     */
    public function updateScene(Request $request, $filmId, $sceneId)
    {
        $this->requireCan($request, $filmId, 'scene.edit');
        $scene = Scene::where('film_id', $filmId)->findOrFail($sceneId);

        $validated = $request->validate([
            'scene_number' => 'nullable|string',
            'scene_heading' => 'nullable|string',
            'int_ext' => 'nullable|string',
            'location_id' => 'nullable|integer|exists:locations,id',
            'day_or_night' => 'nullable|string',
            'page_count' => 'nullable|numeric',
            'summary' => 'nullable|string',
            'status' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        $scene->update($validated);

        return response()->json($scene);
    }

    /**
     * Associate or reorder scenes on a schedule day.
     */
    public function addSceneToSchedule(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'schedule.edit');
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'scene_ids' => 'required|array',
            'scene_ids.*' => 'integer|exists:scenes,id',
        ]);

        $schedule = Schedule::where('film_id', $filmId)->findOrFail($validated['schedule_id']);

        // Sync with pivot containing order_index
        $syncData = [];
        foreach ($validated['scene_ids'] as $index => $sceneId) {
            $syncData[$sceneId] = ['order_index' => $index];
        }

        $schedule->scenes()->sync($syncData);

        return response()->json([
            'message' => 'Scenes synchronized with schedule day.',
            'schedule' => $schedule->load('scenes'),
        ]);
    }

    /**
     * Update a schedule day.
     */
    public function updateSchedule(Request $request, $filmId, $scheduleId)
    {
        $this->requireCan($request, $filmId, 'schedule.edit');
        $schedule = Schedule::where('film_id', $filmId)->findOrFail($scheduleId);

        $validated = $request->validate([
            'day_number' => 'nullable|integer',
            'shoot_date' => 'nullable|date',
            'status' => 'nullable|string',
            'call_time' => 'nullable|string',
            'wrap_time' => 'nullable|string',
            'location_id' => 'nullable|integer|exists:locations,id',
            'notes' => 'nullable|string',
        ]);

        $schedule->update($validated);

        return response()->json($schedule->load(['scenes', 'location']));
    }

    /**
     * Delete a schedule day.
     */
    public function destroySchedule(Request $request, $filmId, $scheduleId)
    {
        $this->requireCan($request, $filmId, 'schedule.delete');
        $schedule = Schedule::where('film_id', $filmId)->findOrFail($scheduleId);
        $schedule->delete();

        return response()->json(['message' => 'Schedule day deleted successfully.']);
    }

    /**
     * Delete a scene.
     */
    public function destroyScene(Request $request, $filmId, $sceneId)
    {
        $this->requireCan($request, $filmId, 'scene.delete');
        $scene = Scene::where('film_id', $filmId)->findOrFail($sceneId);
        $scene->delete();

        return response()->json(['message' => 'Scene deleted successfully.']);
    }

    /**
     * Export a single schedule day as PDF.
     */
    public function exportPdf(Request $request, $filmId, $scheduleId)
    {
        $schedule = Schedule::where('film_id', $filmId)->with(['scenes', 'location'])->findOrFail($scheduleId);
        $pdf = Pdf::loadView('pdfs.schedule', ['schedule' => $schedule]);
        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="schedule-day-'.$schedule->day_number.'.pdf"',
        ]);
    }
}
