<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Location;
use App\Models\Scene;
use App\Models\Script;
use App\Services\FountainParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SceneController extends Controller
{
    use FilmPermissionTrait;
    public function index(Request $request, $filmId)
    {
        $query = Scene::where('film_id', $filmId);

        // Optional: scope to one script. Without this, a film with more
        // than one script (e.g. multiple drafts/episodes) mixed all of
        // their scenes together in every Scenes panel / scene picker.
        if ($request->filled('script_id')) {
            $query->where('script_id', $request->input('script_id'));
        }

        $scenes = $query
            ->with('location:id,name')
            ->orderBy('order_index')
            ->orderBy('scene_number')
            ->get();

        return response()->json($scenes);
    }

    public function show(Request $request, $filmId, $id)
    {
        $scene = Scene::where('film_id', $filmId)->findOrFail($id);
        return response()->json($scene);
    }

    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'scene.create');
        $validated = $request->validate([
            'scene_number' => 'nullable|string|max:20',
            'scene_heading' => 'nullable|string|max:500',
            'int_ext' => 'nullable|string|max:20',
            'location_id' => 'nullable|exists:locations,id',
            'day_or_night' => 'nullable|string|max:20',
            'page_count' => 'nullable|numeric',
            'summary' => 'nullable|string',
            'status' => 'nullable|string|max:50',
            'order_index' => 'nullable|integer',
            'script_id' => 'nullable|exists:scripts,id',
        ]);

        $validated['film_id'] = $filmId;
        $validated['order_index'] = $validated['order_index'] ?? Scene::where('film_id', $filmId)->max('order_index') + 1;

        $scene = Scene::create($validated);

        return response()->json($scene, 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'scene.edit');
        $scene = Scene::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'scene_number' => 'nullable|string|max:20',
            'scene_heading' => 'nullable|string|max:500',
            'int_ext' => 'nullable|string|max:20',
            'location_id' => 'nullable|exists:locations,id',
            'day_or_night' => 'nullable|string|max:20',
            'page_count' => 'nullable|numeric',
            'summary' => 'nullable|string',
            'status' => 'nullable|string|max:50',
            'order_index' => 'nullable|integer',
            'script_id' => 'nullable|exists:scripts,id',
        ]);

        $scene->update($validated);

        return response()->json($scene);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'scene.delete');
        $scene = Scene::where('film_id', $filmId)->findOrFail($id);
        $scene->delete();

        return response()->json(['message' => 'Scene deleted.']);
    }

    public function autoExtract(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'scene.edit');
        $validated = $request->validate([
            'script_id' => 'required|exists:scripts,id',
        ]);

        $script = Script::where('film_id', $filmId)->findOrFail($validated['script_id']);

        $parser = app(FountainParser::class);
        $parsedScenes = $parser->parse($script->content ?? '');

        if (empty($parsedScenes)) {
            return response()->json(['message' => 'No scenes detected.', 'scenes' => []]);
        }

        $locations = Location::where('film_id', $filmId)->get();

        // Reconcile by scene_number instead of delete-all-recreate — see
        // the same fix in ScriptController::autoExtract for why: scenes
        // with breakdown/shot-list rows attached must keep their id.
        $result = [];
        DB::transaction(function () use ($filmId, $script, $parsedScenes, $locations, &$result) {
            $existingScenes = Scene::where('film_id', $filmId)
                ->where('script_id', $script->id)
                ->get()
                ->keyBy(fn ($scene) => (string) $scene->scene_number);

            $seenSceneNumbers = [];

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

                $key = (string) $ps['scene_number'];
                $seenSceneNumbers[] = $key;

                $attrs = [
                    'scene_heading' => $ps['scene_heading'],
                    'int_ext' => $ps['int_ext'],
                    'day_or_night' => $ps['day_or_night'],
                    'location_id' => $locationId,
                    'order_index' => $i,
                    'page_count' => $ps['page_count'],
                ];

                if ($existingScenes->has($key)) {
                    $existingScenes->get($key)->update($attrs);
                    $result[] = $existingScenes->get($key);
                } else {
                    $result[] = Scene::create(array_merge($attrs, [
                        'film_id' => $filmId,
                        'script_id' => $script->id,
                        'scene_number' => $ps['scene_number'],
                        'status' => 'Not Started',
                    ]));
                }
            }

            $existingScenes
                ->reject(fn ($scene, $key) => in_array($key, $seenSceneNumbers, true))
                ->each(fn ($scene) => $scene->delete());
        });

        return response()->json([
            'message' => count($result) . ' scenes extracted.',
            'scenes' => $result,
        ]);
    }

    public function reorder(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'scene.edit');
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|integer|exists:scenes,id',
            'order.*.order_index' => 'required|integer',
        ]);

        foreach ($validated['order'] as $item) {
            Scene::where('film_id', $filmId)->where('id', $item['id'])->update(['order_index' => $item['order_index']]);
        }

        return response()->json(['message' => 'Scenes reordered.']);
    }

    public function splitScene(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'scene.edit');
        $scene = Scene::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'new_heading' => 'required|string|max:500',
        ]);

        $parser = app(FountainParser::class);
        $newIntExt = $parser->extractIntExt($validated['new_heading']);
        $newDayOrNight = $parser->extractDayOrNight($validated['new_heading']);

        $maxOrder = Scene::where('film_id', $filmId)->max('order_index') ?? 0;

        DB::transaction(function () use ($filmId, $scene, $validated, $newIntExt, $newDayOrNight, $maxOrder, &$newScene) {
            $newScene = Scene::create([
                'film_id' => $filmId,
                'script_id' => $scene->script_id,
                'scene_number' => $scene->scene_number . 'A',
                'scene_heading' => $validated['new_heading'],
                'int_ext' => $newIntExt,
                'day_or_night' => $newDayOrNight,
                'order_index' => $maxOrder + 1,
                'page_count' => 0,
                'status' => 'Not Started',
            ]);

            $scene->update(['scene_number' => $scene->scene_number . 'B']);
        });

        return response()->json([
            'message' => 'Scene split.',
            'original' => $scene->fresh(),
            'new' => $newScene,
        ]);
    }
}
