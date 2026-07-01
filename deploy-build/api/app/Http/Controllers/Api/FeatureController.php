<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\FilmModule;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeatureController extends Controller
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    /**
     * List all available features (modules) for a film.
     */
    public function index(Film $film)
    {
        $modules = FilmModule::where('film_id', $film->id)
            ->get()
            ->keyBy('module_name')
            ->map(fn ($m) => [
                'module_name' => $m->module_name,
                'is_enabled' => $m->is_enabled,
            ]);

        $allModules = collect(PermissionService::getAvailableModules());

        return response()->json(
            $allModules->mapWithKeys(fn ($name) => [
                $name => $modules->get($name, ['module_name' => $name, 'is_enabled' => false])
                    ->only(['module_name', 'is_enabled'])
            ])->values()
        );
    }

    /**
     * Toggle a feature on/off for a film.
     */
    public function toggle(Request $request, Film $film)
    {
        $user = $request->user();

        // Only super admin or film admin can toggle modules
        if (!$user->is_super_admin && !$this->permissionService->isFilmAdmin($user, $film->id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'module_name' => ['required', 'string', 'in:' . implode(',', PermissionService::getAvailableModules())],
            'is_enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $module = FilmModule::updateOrCreate(
            ['film_id' => $film->id, 'module_name' => $request->module_name],
            ['is_enabled' => $request->is_enabled]
        );

        $this->permissionService->logAudit(
            $user, $film, 'updated', 'features',
            'film_module', $module->id,
            null,
            ['module_name' => $module->module_name, 'is_enabled' => $module->is_enabled]
        );

        return response()->json($module);
    }

    /**
     * Enable multiple features at once.
     */
    public function bulkUpdate(Request $request, Film $film)
    {
        $user = $request->user();

        if (!$user->is_super_admin && !$this->permissionService->isFilmAdmin($user, $film->id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'modules' => 'required|array',
            'modules.*.module_name' => ['required', 'string', 'in:' . implode(',', PermissionService::getAvailableModules())],
            'modules.*.is_enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($request->modules as $mod) {
            FilmModule::updateOrCreate(
                ['film_id' => $film->id, 'module_name' => $mod['module_name']],
                ['is_enabled' => $mod['is_enabled']]
            );
        }

        $this->permissionService->logAudit(
            $user, $film, 'updated', 'features',
            'film_modules', null, null,
            ['modules' => $request->modules]
        );

        return response()->json(['message' => 'Modules updated.']);
    }
}
