<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeSheet;
use App\Models\FilmUser;
use Illuminate\Http\Request;

class TimeSheetController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $sheets = TimeSheet::where('film_id', $filmId)
            ->with(['user', 'approver'])
            ->orderBy('shoot_date', 'desc')
            ->get();

        return response()->json($sheets);
    }

    public function show(Request $request, $filmId, $id)
    {
        $sheet = TimeSheet::where('film_id', $filmId)
            ->with(['user', 'approver'])
            ->findOrFail($id);

        return response()->json($sheet);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'shoot_date' => 'required|date',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'break_minutes' => 'nullable|integer',
            'total_hours' => 'nullable|numeric',
            'overtime_hours' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $sheet = TimeSheet::create([
            'film_id' => $filmId,
            'user_id' => $validated['user_id'],
            'shoot_date' => $validated['shoot_date'],
            'check_in' => $validated['check_in'] ?? null,
            'check_out' => $validated['check_out'] ?? null,
            'break_minutes' => $validated['break_minutes'] ?? 0,
            'total_hours' => $validated['total_hours'] ?? 0,
            'overtime_hours' => $validated['overtime_hours'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'status' => 'draft',
        ]);

        return response()->json($sheet->load('user'), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $sheet = TimeSheet::where('film_id', $filmId)->findOrFail($id);

        if ($sheet->status !== 'draft') {
            return response()->json(['message' => 'Only draft entries can be edited.'], 422);
        }

        $validated = $request->validate([
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'break_minutes' => 'nullable|integer',
            'total_hours' => 'nullable|numeric',
            'overtime_hours' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $sheet->update($validated);

        return response()->json($sheet->load(['user', 'approver']));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $sheet = TimeSheet::where('film_id', $filmId)->findOrFail($id);
        $sheet->delete();

        return response()->json(['message' => 'Time sheet deleted.']);
    }

    public function submit(Request $request, $filmId, $id)
    {
        $sheet = TimeSheet::where('film_id', $filmId)->findOrFail($id);

        if ($sheet->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Only the creator can submit this timesheet.'], 403);
        }

        if ($sheet->status !== 'draft') {
            return response()->json(['message' => 'Only draft entries can be submitted.'], 422);
        }

        $sheet->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json($sheet->load(['user', 'approver']));
    }

    public function approve(Request $request, $filmId, $id)
    {
        $sheet = TimeSheet::where('film_id', $filmId)->findOrFail($id);

        $filmUser = FilmUser::where('film_id', $filmId)
            ->where('user_id', $request->user()->id)
            ->first();

        $canApprove = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $filmUser->hasPermission('timesheet.approve') ||
            $request->user()->is_super_admin
        );

        if (!$canApprove) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($sheet->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted entries can be approved.'], 422);
        }

        $sheet->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json($sheet->load(['user', 'approver']));
    }

    public function reject(Request $request, $filmId, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $sheet = TimeSheet::where('film_id', $filmId)->findOrFail($id);

        $filmUser = FilmUser::where('film_id', $filmId)
            ->where('user_id', $request->user()->id)
            ->first();

        $canReject = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $filmUser->hasPermission('timesheet.approve') ||
            $request->user()->is_super_admin
        );

        if (!$canReject) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($sheet->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted entries can be rejected.'], 422);
        }

        $sheet->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json($sheet->load(['user', 'approver']));
    }
}
