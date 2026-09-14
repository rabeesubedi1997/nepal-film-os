<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\CallSheet;
use App\Models\CallSheetEntry;
use App\Models\Schedule;
use App\Models\CastCrew;
use App\Mail\CallSheetMail;
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CallSheetController extends Controller
{
    use FilmPermissionTrait;
    /**
     * Get all call sheets for a film.
     */
    public function index(Request $request, $filmId)
    {
        $callSheets = CallSheet::where('film_id', $filmId)
            ->with(['schedule', 'location'])
            ->orderBy('shoot_date', 'desc')
            ->get();

        return response()->json($callSheets);
    }

    /**
     * Get details of a single call sheet.
     */
    public function show(Request $request, $filmId, $id)
    {
        $callSheet = CallSheet::where('film_id', $filmId)
            ->with(['schedule.scenes.location', 'location', 'entries.castCrew'])
            ->findOrFail($id);

        return response()->json($callSheet);
    }

    /**
     * Generate/create a new call sheet.
     */
    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'call_sheet.create');
        $validated = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'general_call_time' => 'required|string',
            'location_id' => 'nullable|integer|exists:locations,id',
            'catering_info' => 'nullable|string',
            'weather' => 'nullable|string',
            'emergency_info' => 'nullable|string',
            'special_instructions' => 'nullable|string',
            'entries' => 'required|array', // Array of { cast_crew_id, call_time, notes }
            'entries.*.cast_crew_id' => 'required|integer|exists:cast_crew,id',
            'entries.*.call_time' => 'required|string',
            'entries.*.notes' => 'nullable|string',
        ]);

        $schedule = Schedule::where('film_id', $filmId)->findOrFail($validated['schedule_id']);

        return DB::transaction(function () use ($validated, $filmId, $schedule, $request) {
            // Delete existing call sheet for this schedule if any exists to avoid duplicates
            CallSheet::where('film_id', $filmId)->where('schedule_id', $schedule->id)->delete();

            $callSheet = CallSheet::create([
                'film_id' => $filmId,
                'schedule_id' => $schedule->id,
                'shoot_date' => $schedule->shoot_date,
                'general_call_time' => $validated['general_call_time'],
                'location_id' => $validated['location_id'] ?? $schedule->location_id,
                'catering_info' => $validated['catering_info'] ?? 'Breakfast: 7:00 AM, Lunch: 1:00 PM',
                'weather' => $validated['weather'] ?? 'Sunny/Clear',
                'emergency_info' => $validated['emergency_info'] ?? 'Nearest Hospital: Kathmandu Medical College',
                'special_instructions' => $validated['special_instructions'] ?? null,
                // Creating a call sheet is not the same as distributing
                // it to the crew — this used to set is_sent/sent_at right
                // here, which (a) marked every new call sheet as "sent"
                // before anyone was actually notified, and (b) meant the
                // SendCallSheetNotifications job's `is_sent=false AND
                // sent_at IS NOT NULL` query could never match anything.
                'is_sent' => false,
                'sent_at' => null,
                'created_by' => $request->user()->id,
            ]);

            // Add call sheet entries
            foreach ($validated['entries'] as $entry) {
                // Find scenes associated with this cast/crew today (optional stub list)
                $scenesToday = []; 

                CallSheetEntry::create([
                    'call_sheet_id' => $callSheet->id,
                    'cast_crew_id' => $entry['cast_crew_id'],
                    'call_time' => $entry['call_time'],
                    'scenes_today' => $scenesToday,
                    'notes' => $entry['notes'] ?? null,
                    'is_acknowledged' => false,
                ]);
            }

            return response()->json($callSheet->load('entries.castCrew'), 201);
        });
    }

    /**
     * Update a call sheet.
     */
    public function update(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'call_sheet.edit');
        $callSheet = CallSheet::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'general_call_time' => 'nullable|string',
            'location_id' => 'nullable|integer|exists:locations,id',
            'catering_info' => 'nullable|string',
            'weather' => 'nullable|string',
            'emergency_info' => 'nullable|string',
            'special_instructions' => 'nullable|string',
        ]);

        $callSheet->update($validated);

        return response()->json($callSheet->load(['schedule', 'location', 'entries.castCrew']));
    }

    /**
     * Delete a call sheet.
     */
    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'call_sheet.delete');
        $callSheet = CallSheet::where('film_id', $filmId)->findOrFail($id);
        $callSheet->entries()->delete();
        $callSheet->delete();

        return response()->json(['message' => 'Call sheet deleted successfully.']);
    }

    /**
     * Acknowledge call sheet receipt.
     */
    public function acknowledge(Request $request, $filmId, $entryId)
    {
        $entry = CallSheetEntry::whereHas('callSheet', function ($q) use ($filmId) {
            $q->where('film_id', $filmId);
        })->findOrFail($entryId);

        $entry->update([
            'is_acknowledged' => true,
            'acknowledged_at' => now(),
        ]);

        return response()->json([
            'message' => 'Call sheet acknowledged.',
            'entry' => $entry
        ]);
    }

    public function distribute(Request $request, $filmId, $id, WhatsAppService $whatsapp)
    {
        $callSheet = CallSheet::with(['film', 'entries.castCrew', 'schedule', 'location'])
            ->where('film_id', $filmId)
            ->findOrFail($id);

        $emails = $callSheet->entries
            ->pluck('castCrew.contact_email')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // Crew on WhatsApp (the dominant channel for this on Nepali
        // productions) but with no email should still be notified — this
        // used to only ever email, so the WhatsAppService existed but was
        // never actually called from anywhere.
        $hasWhatsappRecipient = $callSheet->entries->pluck('castCrew.whatsapp')->filter()->isNotEmpty();

        if (empty($emails) && !$hasWhatsappRecipient) {
            return response()->json(['message' => 'No crew email or WhatsApp contact found.'], 400);
        }

        foreach ($emails as $email) {
            Mail::to($email)->send(new CallSheetMail($callSheet));
        }

        $whatsappResults = $hasWhatsappRecipient ? $whatsapp->sendCallSheet($callSheet) : [];

        $callSheet->update([
            'is_sent' => true,
            'sent_at' => now(),
        ]);

        $whatsappSent = collect($whatsappResults)->where('sent', true)->count();

        return response()->json([
            'message' => "Call sheet distributed: " . count($emails) . " email(s), {$whatsappSent} WhatsApp message(s) sent.",
        ]);
    }

    public function exportPdf($filmId, $id)
    {
        $callSheet = CallSheet::with(['film', 'schedule.scenes.location', 'location', 'entries.castCrew'])
            ->where('film_id', $filmId)
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdfs.call-sheet', [
            'callSheet' => $callSheet,
            'film' => $callSheet->film,
            'schedule' => $callSheet->schedule,
            'location' => $callSheet->location,
            'entries' => $callSheet->entries,
        ]);

        return $pdf->download("call-sheet-{$callSheet->shoot_date}.pdf");
    }
}
