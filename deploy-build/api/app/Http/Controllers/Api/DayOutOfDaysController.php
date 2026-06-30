<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CastCrew;
use App\Models\Schedule;
use App\Models\CastAvailability;
use Illuminate\Http\Request;

class DayOutOfDaysController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $schedules = Schedule::where('film_id', $filmId)
            ->orderBy('shoot_date')
            ->get(['id', 'day_number', 'shoot_date', 'status']);

        $castCrew = CastCrew::where('film_id', $filmId)
            ->where('role_type', 'cast')
            ->orderBy('character_name')
            ->get(['id', 'name', 'character_name', 'role_name']);

        $availabilities = CastAvailability::where('film_id', $filmId)
            ->get()
            ->groupBy('cast_crew_id');

        $rows = [];
        foreach ($castCrew as $member) {
            $days = [];
            $memberAvail = $availabilities->get($member->id, collect())->keyBy('shoot_date');
            foreach ($schedules as $sched) {
                $avail = $memberAvail->get($sched->shoot_date);
                $days[] = [
                    'date' => $sched->shoot_date,
                    'status' => $avail ? $avail->status : 'not_required',
                    'day_number' => $sched->day_number,
                ];
            }
            $rows[] = [
                'id' => $member->id,
                'name' => $member->name,
                'character_name' => $member->character_name,
                'role_name' => $member->role_name,
                'days' => $days,
            ];
        }

        return response()->json([
            'schedules' => $schedules,
            'cast' => $rows,
        ]);
    }

    public function update(Request $request, $filmId)
    {
        $data = $request->validate([
            'cast_crew_id' => 'required|exists:cast_crew,id',
            'shoot_date' => 'required|date',
            'status' => 'required|in:working,hold,available,released,not_required',
        ]);

        CastAvailability::updateOrCreate(
            [
                'cast_crew_id' => $data['cast_crew_id'],
                'shoot_date' => $data['shoot_date'],
                'film_id' => $filmId,
            ],
            ['status' => $data['status']]
        );

        return response()->json(['message' => 'Availability updated']);
    }
}
