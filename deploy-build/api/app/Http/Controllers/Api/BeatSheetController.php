<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\BeatSheet;
use App\Models\Beat;
use Illuminate\Http\Request;

class BeatSheetController extends Controller
{
    use FilmPermissionTrait;

    public function index(Request $request, $filmId)
    {
        $sheets = BeatSheet::where('film_id', $filmId)
            ->with('creator:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sheets);
    }

    public function show(Request $request, $filmId, $id)
    {
        $sheet = BeatSheet::where('film_id', $filmId)
            ->with(['creator:id,name', 'beats.creator:id,name'])
            ->findOrFail($id);

        return response()->json($sheet);
    }

    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'beats.create');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $sheet = BeatSheet::create([
            'film_id' => $filmId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        $sheet->load('creator:id,name');

        return response()->json($sheet, 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'beats.edit');

        $sheet = BeatSheet::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $sheet->update($validated);

        $sheet->load('creator:id,name');

        return response()->json($sheet);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'beats.delete');

        $sheet = BeatSheet::where('film_id', $filmId)->findOrFail($id);
        $sheet->delete();

        return response()->json(['message' => 'Beat sheet deleted.']);
    }

    public function storeBeat(Request $request, $filmId, $beatSheetId)
    {
        $this->requireCan($request, $filmId, 'beats.create');

        $sheet = BeatSheet::where('film_id', $filmId)->findOrFail($beatSheetId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'position_x' => 'nullable|integer',
            'position_y' => 'nullable|integer',
            'act_label' => 'nullable|string|max:100',
            'scene_number' => 'nullable|string|max:20',
            'order_index' => 'nullable|integer',
        ]);

        $maxOrder = Beat::where('beat_sheet_id', $sheet->id)->max('order_index');

        $beat = Beat::create([
            'beat_sheet_id' => $sheet->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#e2a309',
            'position_x' => $validated['position_x'] ?? 0,
            'position_y' => $validated['position_y'] ?? 0,
            'act_label' => $validated['act_label'] ?? null,
            'scene_number' => $validated['scene_number'] ?? null,
            'order_index' => $validated['order_index'] ?? ($maxOrder + 1),
            'created_by' => $request->user()->id,
        ]);

        $beat->load('creator:id,name');

        return response()->json($beat, 201);
    }

    public function updateBeat(Request $request, $filmId, $beatSheetId, $beatId)
    {
        $this->requireCan($request, $filmId, 'beats.edit');

        BeatSheet::where('film_id', $filmId)->findOrFail($beatSheetId);

        $beat = Beat::where('beat_sheet_id', $beatSheetId)->findOrFail($beatId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'position_x' => 'nullable|integer',
            'position_y' => 'nullable|integer',
            'act_label' => 'nullable|string|max:100',
            'scene_number' => 'nullable|string|max:20',
            'order_index' => 'nullable|integer',
        ]);

        $beat->update($validated);

        $beat->load('creator:id,name');

        return response()->json($beat);
    }

    public function destroyBeat(Request $request, $filmId, $beatSheetId, $beatId)
    {
        $this->requireCan($request, $filmId, 'beats.delete');

        BeatSheet::where('film_id', $filmId)->findOrFail($beatSheetId);

        $beat = Beat::where('beat_sheet_id', $beatSheetId)->findOrFail($beatId);
        $beat->delete();

        return response()->json(['message' => 'Beat deleted.']);
    }

    public function reorderBeats(Request $request, $filmId, $beatSheetId)
    {
        $this->requireCan($request, $filmId, 'beats.edit');

        BeatSheet::where('film_id', $filmId)->findOrFail($beatSheetId);

        $validated = $request->validate([
            'beats' => 'required|array',
            'beats.*.id' => 'required|integer|exists:beats,id',
            'beats.*.position_x' => 'nullable|integer',
            'beats.*.position_y' => 'nullable|integer',
            'beats.*.order_index' => 'nullable|integer',
        ]);

        foreach ($validated['beats'] as $beatData) {
            Beat::where('id', $beatData['id'])
                ->where('beat_sheet_id', $beatSheetId)
                ->update([
                    'position_x' => $beatData['position_x'] ?? 0,
                    'position_y' => $beatData['position_y'] ?? 0,
                    'order_index' => $beatData['order_index'] ?? 0,
                ]);
        }

        return response()->json(['message' => 'Beats reordered.']);
    }
}
