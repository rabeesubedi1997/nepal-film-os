<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Series;
use App\Models\Film;
use App\Models\FilmUser;
use Illuminate\Http\Request;

class SeriesController extends Controller
{
    /**
     * Films (and, through them, film titles/production companies) the
     * requesting user actually has access to — used to scope Series so
     * one customer's productions never leak into another's listing.
     */
    private function accessibleFilmIds(Request $request)
    {
        return FilmUser::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->pluck('film_id');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Series::orderBy('created_at', 'desc');

        if ($user && $user->is_super_admin) {
            $series = $query->with('films')->get();
        } else {
            $filmIds = $this->accessibleFilmIds($request);
            $series = $query
                ->whereHas('films', fn ($q) => $q->whereIn('films.id', $filmIds))
                ->with(['films' => fn ($q) => $q->whereIn('films.id', $filmIds)])
                ->get();
        }

        return response()->json($series);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        if ($user && $user->is_super_admin) {
            $series = Series::with('films')->findOrFail($id);
            return response()->json($series);
        }

        $filmIds = $this->accessibleFilmIds($request);
        $series = Series::whereHas('films', fn ($q) => $q->whereIn('films.id', $filmIds))
            ->with(['films' => fn ($q) => $q->whereIn('films.id', $filmIds)])
            ->find($id);

        if (!$series) {
            return response()->json(['message' => 'Series not found.'], 404);
        }

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
