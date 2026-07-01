<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\ContinuityRecord;
use Illuminate\Http\Request;

class ContinuityController extends Controller
{
    use FilmPermissionTrait;
    use FilmPermissionTrait;
    public function index(Request $request, $filmId)
    {
        $records = ContinuityRecord::where('film_id', $filmId)
            ->with(['scene', 'capturedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($records);
    }

    public function show(Request $request, $filmId, $id)
    {
        $record = ContinuityRecord::where('film_id', $filmId)
            ->with(['scene', 'capturedBy'])
            ->findOrFail($id);

        return response()->json($record);
    }

    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'continuity.create');
        $validated = $request->validate([
            'scene_id' => 'required|integer|exists:scenes,id',
            'type' => 'required|string|in:wardrobe,hair,makeup,props,set',
            'continuity_photo' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $record = ContinuityRecord::create([
            'film_id' => $filmId,
            'scene_id' => $validated['scene_id'],
            'type' => $validated['type'],
            'continuity_photo' => $validated['continuity_photo'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'captured_by' => $request->user()->id,
        ]);

        return response()->json($record->load(['scene', 'capturedBy']), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'continuity.edit');
        $record = ContinuityRecord::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'type' => 'nullable|string|in:wardrobe,hair,makeup,props,set',
            'continuity_photo' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $record->update($validated);

        return response()->json($record->load(['scene', 'capturedBy']));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'continuity.delete');
        $record = ContinuityRecord::where('film_id', $filmId)->findOrFail($id);
        $record->delete();

        return response()->json(['message' => 'Continuity record deleted.']);
    }
}
