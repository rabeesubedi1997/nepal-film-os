<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $vendors = Vendor::where('film_id', $filmId)
            ->orderBy('name')
            ->get();
        return response()->json($vendors);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:equipment,catering,transport,costume,post_production,other',
            'contact_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'services' => 'nullable|string',
            'rate' => 'nullable|numeric',
            'currency' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        $vendor = Vendor::create([
            'film_id' => $filmId,
            ...$validated,
            'currency' => $validated['currency'] ?? 'NPR',
        ]);

        return response()->json($vendor, 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $vendor = Vendor::where('film_id', $filmId)->findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:equipment,catering,transport,costume,post_production,other',
            'contact_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'services' => 'nullable|string',
            'rate' => 'nullable|numeric',
            'currency' => 'nullable|string|max:10',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);
        $vendor->update($validated);
        return response()->json($vendor);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $vendor = Vendor::where('film_id', $filmId)->findOrFail($id);
        $vendor->delete();
        return response()->json(['message' => 'Vendor deleted.']);
    }
}
