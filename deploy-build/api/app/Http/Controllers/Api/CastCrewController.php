<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\CastCrew;
use Illuminate\Http\Request;

class CastCrewController extends Controller
{
    use FilmPermissionTrait;
    /**
     * Get all cast and crew profiles for a film.
     */
    public function index(Request $request, $filmId)
    {
        $members = CastCrew::where('film_id', $filmId)
            ->with('user')
            ->orderBy('role_type', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($members);
    }

    /**
     * Store a new cast or crew member.
     */
    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'cast_crew.create');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role_type' => 'required|string|in:Cast,Crew',
            'role_name' => 'required|string|max:255', // e.g., Lead Actor, DOP, Grip
            'department' => 'nullable|string|max:255',
            'character_name' => 'nullable|string|max:255', // only for Cast
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|string|email|max:255',
            'whatsapp' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'contract_status' => 'nullable|string|in:Pending,Signed,Rejected',
            'day_rates' => 'nullable|numeric',
        ]);

        $member = CastCrew::create([
            'film_id' => $filmId,
            'user_id' => null, // Optionally linked to users table if they accept invitation
            'name' => $validated['name'],
            'role_type' => $validated['role_type'],
            'role_name' => $validated['role_name'],
            'department' => $validated['department'] ?? ($validated['role_type'] === 'Cast' ? 'Cast' : 'Production'),
            'character_name' => $validated['character_name'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
            'contract_status' => $validated['contract_status'] ?? 'Pending',
            'day_rates' => $validated['day_rates'] ?? 0.00,
        ]);

        return response()->json($member, 201);
    }

    /**
     * Update a cast or crew member.
     */
    public function update(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'cast_crew.edit');
        $member = CastCrew::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'role_type' => 'nullable|string|in:Cast,Crew',
            'role_name' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'character_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|string|email|max:255',
            'whatsapp' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'contract_status' => 'nullable|string|in:Pending,Signed,Rejected',
            'day_rates' => 'nullable|numeric',
        ]);

        $member->update($validated);

        return response()->json($member);
    }

    /**
     * Delete a cast or crew member.
     */
    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'cast_crew.delete');
        $member = CastCrew::where('film_id', $filmId)->findOrFail($id);
        $member->delete();

        return response()->json([
            'message' => 'Cast/Crew profile deleted successfully.'
        ]);
    }
}
