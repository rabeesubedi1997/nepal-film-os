<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShotList;
use Illuminate\Http\Request;

class ShotListController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $shots = ShotList::where('film_id', $filmId)
            ->with(['scene', 'creator'])
            ->orderBy('scene_id')
            ->orderBy('shot_number')
            ->get();

        return response()->json($shots);
    }

    public function show(Request $request, $filmId, $id)
    {
        $shot = ShotList::where('film_id', $filmId)
            ->with(['scene', 'creator'])
            ->findOrFail($id);

        return response()->json($shot);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'scene_id' => 'required|integer|exists:scenes,id',
            'shot_number' => 'required|string',
            'shot_type' => 'nullable|string',
            'camera_angle' => 'nullable|string',
            'lens_mm' => 'nullable|integer',
            'movement' => 'nullable|string',
            'description' => 'nullable|string',
            'storyboard_image' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'status' => 'nullable|string',
        ]);

        $shot = ShotList::create([
            'film_id' => $filmId,
            'scene_id' => $validated['scene_id'],
            'shot_number' => $validated['shot_number'],
            'shot_type' => $validated['shot_type'] ?? null,
            'camera_angle' => $validated['camera_angle'] ?? null,
            'lens_mm' => $validated['lens_mm'] ?? null,
            'movement' => $validated['movement'] ?? null,
            'description' => $validated['description'] ?? null,
            'storyboard_image' => $validated['storyboard_image'] ?? null,
            'duration_seconds' => $validated['duration_seconds'] ?? null,
            'status' => $validated['status'] ?? 'Not Started',
            'created_by' => $request->user()->id,
        ]);

        return response()->json($shot->load(['scene', 'creator']), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $shot = ShotList::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'shot_number' => 'nullable|string',
            'shot_type' => 'nullable|string',
            'camera_angle' => 'nullable|string',
            'lens_mm' => 'nullable|integer',
            'movement' => 'nullable|string',
            'description' => 'nullable|string',
            'storyboard_image' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'status' => 'nullable|string',
        ]);

        $shot->update($validated);

        return response()->json($shot->load(['scene', 'creator']));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $shot = ShotList::where('film_id', $filmId)->findOrFail($id);
        $shot->delete();

        return response()->json(['message' => 'Shot deleted.']);
    }
}
