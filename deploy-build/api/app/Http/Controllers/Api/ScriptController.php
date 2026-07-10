<?php

namespace App\Http\Controllers\Api;

use App\Events\ScriptUpdated;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Location;
use App\Models\Script;
use App\Models\ScriptDraft;
use App\Models\ScriptVersion;
use App\Models\Scene;
use App\Services\FountainParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScriptController extends Controller
{
    use FilmPermissionTrait;
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
        $this->requireCan($request, $filmId, 'script.create');
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
        $this->requireCan($request, $filmId, 'script.edit');
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
        $this->requireCan($request, $filmId, 'script.delete');
        $script = Script::where('film_id', $filmId)->findOrFail($id);
        $script->delete();

        return response()->json(['message' => 'Script deleted.']);
    }

    public function versions(Request $request, $filmId, $id)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($id);
        $versions = ScriptVersion::where('script_id', $script->id)
            ->with('creator:id,name')
            ->orderBy('version_number', 'desc')
            ->get();
        return response()->json($versions);
    }

    public function restoreVersion(Request $request, $filmId, $id, $versionId)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $script = Script::where('film_id', $filmId)->findOrFail($id);
        $version = ScriptVersion::where('script_id', $script->id)->findOrFail($versionId);

        $script->update([
            'title' => $version->title,
            'content' => $version->content,
        ]);

        broadcast(new ScriptUpdated($script, $request->user(), 'restored'))->toOthers();
        return response()->json(['message' => 'Script restored from version ' . $version->version_number]);
    }

    public function createVersion(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $script = Script::where('film_id', $filmId)->findOrFail($id);

        $latestVersion = ScriptVersion::where('script_id', $script->id)->max('version_number') ?? 0;

        $version = ScriptVersion::create([
            'script_id' => $script->id,
            'film_id' => $filmId,
            'title' => $script->title,
            'content' => $script->content,
            'version_number' => $latestVersion + 1,
            'description' => $request->input('description'),
            'created_by' => $request->user()->id,
        ]);

        $version->load('creator:id,name');
        return response()->json($version, 201);
    }

    public function drafts(Request $request, $filmId, $id)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($id);
        $drafts = ScriptDraft::where('script_id', $script->id)
            ->where('is_archived', false)
            ->with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($drafts);
    }

    public function storeDraft(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $script = Script::where('film_id', $filmId)->findOrFail($id);

        $draft = ScriptDraft::create([
            'script_id' => $script->id,
            'film_id' => $filmId,
            'title' => $request->input('title', $script->title . ' (Draft)'),
            'content' => $request->input('content', $script->content),
            'description' => $request->input('description'),
            'is_archived' => false,
            'created_by' => $request->user()->id,
        ]);

        $draft->load('creator:id,name');
        return response()->json($draft, 201);
    }

    public function updateDraft(Request $request, $filmId, $id, $draftId)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $draft = ScriptDraft::where('film_id', $filmId)->where('script_id', $id)->findOrFail($draftId);
        $draft->update($request->only(['title', 'content', 'description']));
        return response()->json($draft);
    }

    public function deleteDraft(Request $request, $filmId, $id, $draftId)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $draft = ScriptDraft::where('film_id', $filmId)->where('script_id', $id)->findOrFail($draftId);
        $draft->delete();
        return response()->json(['message' => 'Draft deleted']);
    }

    public function archiveDraft(Request $request, $filmId, $id, $draftId)
    {
        $this->requireCan($request, $filmId, 'script.edit');
        $draft = ScriptDraft::where('film_id', $filmId)->where('script_id', $id)->findOrFail($draftId);
        $draft->update(['is_archived' => true]);
        return response()->json(['message' => 'Draft archived']);
    }

    private function autoExtract(Script $script)
    {
        if (empty($script->content)) return;

        $plainText = strip_tags($script->content);
        $plainText = html_entity_decode($plainText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $plainText = preg_replace('/&nbsp;/', ' ', $plainText);

        $parser = app(FountainParser::class);
        $parsedScenes = $parser->parse($plainText);

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
