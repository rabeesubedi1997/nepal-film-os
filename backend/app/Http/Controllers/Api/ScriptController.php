<?php

namespace App\Http\Controllers\Api;

use App\Events\ScriptUpdated;
use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Script;
use App\Models\Scene;
use App\Services\FountainParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScriptController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $scripts = Script::where('film_id', $filmId)
            ->with('creator:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($scripts);
    }

    public function show(Request $request, $filmId, $id)
    {
        $script = Script::where('film_id', $filmId)
            ->with('creator:id,name')
            ->findOrFail($id);

        return response()->json($script);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $script = Script::create([
            'film_id' => $filmId,
            'title' => $validated['title'],
            'content' => $validated['content'] ?? '',
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        $script->load('creator:id,name');
        $this->autoExtract($script);

        broadcast(new ScriptUpdated($script, $request->user(), 'created'))->toOthers();

        return response()->json($script, 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $script->update($validated);

        if ($request->input('auto_extract', true)) {
            $this->autoExtract($script);
        }

        broadcast(new ScriptUpdated($script, $request->user(), 'updated'))->toOthers();

        return response()->json($script);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($id);
        $script->delete();

        return response()->json(['message' => 'Script deleted.']);
    }

    private function autoExtract(Script $script)
    {
        if (empty($script->content)) return;

        $parser = app(FountainParser::class);
        $parsedScenes = $parser->parse($script->content);

        if (empty($parsedScenes)) return;

        $locations = Location::where('film_id', $script->film_id)->get();

        DB::transaction(function () use ($script, $parsedScenes, $locations) {
            Scene::where('film_id', $script->film_id)
                ->where('script_id', $script->id)
                ->delete();

            foreach ($parsedScenes as $i => $ps) {
                $locationId = null;
                $locName = $ps['location_name'] ?? '';
                if ($locName) {
                    $match = $locations->first(fn($loc) =>
                        str_contains(strtoupper($loc->name), strtoupper($locName)) ||
                        str_contains(strtoupper($locName), strtoupper($loc->name))
                    );
                    $locationId = $match?->id;
                }

                Scene::create([
                    'film_id' => $script->film_id,
                    'script_id' => $script->id,
                    'scene_number' => $ps['scene_number'],
                    'scene_heading' => $ps['scene_heading'],
                    'int_ext' => $ps['int_ext'],
                    'day_or_night' => $ps['day_or_night'],
                    'location_id' => $locationId,
                    'order_index' => $i,
                    'page_count' => $ps['page_count'],
                    'status' => 'Not Started',
                ]);
            }
        });
    }
}
