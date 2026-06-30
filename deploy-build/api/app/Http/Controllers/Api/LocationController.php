<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $locations = Location::where('film_id', $filmId)->get();

        return response()->json($locations);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'gps_lat' => 'nullable|numeric',
            'gps_lng' => 'nullable|numeric',
            'photos' => 'nullable|array',
            'permit_status' => 'nullable|string',
            'permit_document' => 'nullable|string',
            'contact_name' => 'nullable|string',
            'contact_phone' => 'nullable|string',
            'parking_info' => 'nullable|string',
            'facilities_notes' => 'nullable|string',
        ]);

        $location = Location::create([
            'film_id' => $filmId,
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'gps_lat' => $validated['gps_lat'] ?? null,
            'gps_lng' => $validated['gps_lng'] ?? null,
            'photos' => $validated['photos'] ?? [],
            'permit_status' => $validated['permit_status'] ?? 'Not Required',
            'permit_document' => $validated['permit_document'] ?? null,
            'contact_name' => $validated['contact_name'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'parking_info' => $validated['parking_info'] ?? null,
            'facilities_notes' => $validated['facilities_notes'] ?? null,
        ]);

        return response()->json($location, 201);
    }

    public function show(Request $request, $filmId, $id)
    {
        $location = Location::where('film_id', $filmId)->findOrFail($id);

        return response()->json($location);
    }

    public function update(Request $request, $filmId, $id)
    {
        $location = Location::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'gps_lat' => 'nullable|numeric',
            'gps_lng' => 'nullable|numeric',
            'photos' => 'nullable|array',
            'permit_status' => 'nullable|string',
            'permit_document' => 'nullable|string',
            'contact_name' => 'nullable|string',
            'contact_phone' => 'nullable|string',
            'parking_info' => 'nullable|string',
            'facilities_notes' => 'nullable|string',
        ]);

        $location->update($validated);

        return response()->json($location);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $location = Location::where('film_id', $filmId)->findOrFail($id);
        $location->delete();

        return response()->json(['message' => 'Location deleted successfully.']);
    }
}
