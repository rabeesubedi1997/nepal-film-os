<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Series;
use App\Models\Film;
use Illuminate\Http\Request;

class SeriesController extends Controller
{
    public function index(Request $request)
    {
        $series = Series::with('films')->orderBy('created_at', 'desc')->get();

        return response()->json($series);
    }

    public function show(Request $request, $id)
    {
        $series = Series::with('films')->findOrFail($id);

        return response()->json($series);
    }

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->is_super_admin) {
            abort(403, 'Only super admins can create series.');
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'total_episodes' => 'nullable|integer',
        ]);

        $series = Series::create([
            'title' => $validated['title'],
            'total_episodes' => $validated['total_episodes'] ?? 0,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($series, 201);
    }

    public function update(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->is_super_admin) {
            abort(403, 'Only super admins can update series.');
        }
        $series = Series::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'total_episodes' => 'nullable|integer',
        ]);

        $series->update($validated);

        return response()->json($series);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->is_super_admin) {
            abort(403, 'Only super admins can delete series.');
        }
        $series = Series::findOrFail($id);
        $series->films()->update(['series_id' => null]);
        $series->delete();

        return response()->json(['message' => 'Series deleted.']);
    }
}
