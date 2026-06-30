<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WardrobeItem;
use Illuminate\Http\Request;

class WardrobeController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $items = WardrobeItem::where('film_id', $filmId)
            ->with('scene')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($items);
    }

    public function show(Request $request, $filmId, $id)
    {
        $item = WardrobeItem::where('film_id', $filmId)
            ->with('scene')
            ->findOrFail($id);

        return response()->json($item);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'character_name' => 'nullable|string|max:255',
            'scene_id' => 'nullable|integer|exists:scenes,id',
            'description' => 'required|string',
            'continuity_photo' => 'nullable|string',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|string',
        ]);

        $item = WardrobeItem::create([
            'film_id' => $filmId,
            'character_name' => $validated['character_name'] ?? null,
            'scene_id' => $validated['scene_id'] ?? null,
            'description' => $validated['description'],
            'continuity_photo' => $validated['continuity_photo'] ?? null,
            'status' => $validated['status'] ?? 'Ready',
            'notes' => $validated['notes'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        return response()->json($item->load('scene'), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $item = WardrobeItem::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'character_name' => 'nullable|string|max:255',
            'scene_id' => 'nullable|integer|exists:scenes,id',
            'description' => 'nullable|string',
            'continuity_photo' => 'nullable|string',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json($item->load('scene'));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $item = WardrobeItem::where('film_id', $filmId)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Wardrobe item deleted.']);
    }
}
