<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BreakdownItem;
use App\Models\Scene;
use Illuminate\Http\Request;

class ScriptBreakdownController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $breakdowns = BreakdownItem::where('film_id', $filmId)
            ->with('scene:id,scene_number,scene_heading')
            ->orderBy('created_at', 'desc')
            ->get();

        $scenes = Scene::where('film_id', $filmId)
            ->orderBy('order_index')
            ->orderBy('scene_number')
            ->get(['id', 'scene_number', 'scene_heading']);

        return response()->json([
            'breakdowns' => $breakdowns,
            'scenes' => $scenes,
        ]);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'scene_id' => 'required|integer|exists:scenes,id',
            'category' => 'required|string|in:cast,props,wardrobe,sfx,vehicles,extras',
            'item_name' => 'required|string|max:255',
            'quantity' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['film_id'] = $filmId;
        $validated['quantity'] = $validated['quantity'] ?? 1;

        $item = BreakdownItem::create($validated);

        return response()->json($item->load('scene:id,scene_number,scene_heading'), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $item = BreakdownItem::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'scene_id' => 'nullable|integer|exists:scenes,id',
            'category' => 'nullable|string|in:cast,props,wardrobe,sfx,vehicles,extras',
            'item_name' => 'nullable|string|max:255',
            'quantity' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $item->update($validated);

        return response()->json($item->load('scene:id,scene_number,scene_heading'));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $item = BreakdownItem::where('film_id', $filmId)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Breakdown item deleted.']);
    }
}
