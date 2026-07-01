<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    private function getFilmUser($filmId, $userId)
    {
        return FilmUser::where('film_id', $filmId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }

    private function requireAdmin($filmUser, $user = null)
    {
        if ($user && $user->is_super_admin) {
            return;
        }
        if (!$filmUser) {
            abort(403, 'Unauthorized.');
        }
        $isAdmin = $filmUser->filmRole ? $filmUser->filmRole->is_admin : $filmUser->role === 'Producer' || $filmUser->role === 'Super Admin';
        if (!$isAdmin) {
            abort(403, 'Only film admins can manage roles.');
        }
    }

    public function index($filmId)
    {
        $roles = FilmRole::where('film_id', $filmId)
            ->withCount('filmUsers')
            ->orderBy('is_admin', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($roles);
    }

    public function store(Request $request, $filmId)
    {
        $film = Film::findOrFail($filmId);

        $filmUser = $this->getFilmUser($filmId, $request->user()->id);
        $this->requireAdmin($filmUser, $request->user());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $count = 1;
        while (FilmRole::where('film_id', $filmId)->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        $role = FilmRole::create([
            'film_id' => $filmId,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_admin' => false,
            'permissions' => $validated['permissions'] ?? [],
            'created_by' => $request->user()->id,
        ]);

        return response()->json($role, 201);
    }

    public function show($filmId, $roleId)
    {
        $role = FilmRole::where('film_id', $filmId)
            ->with(['filmUsers.user', 'creator'])
            ->findOrFail($roleId);

        return response()->json($role);
    }

    public function update(Request $request, $filmId, $roleId)
    {
        $role = FilmRole::where('film_id', $filmId)->findOrFail($roleId);

        $filmUser = $this->getFilmUser($filmId, $request->user()->id);
        $this->requireAdmin($filmUser, $request->user());

        if ($role->is_admin) {
            return response()->json(['message' => 'Cannot modify the Admin role.'], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $data = [];
        if (isset($validated['name'])) {
            $data['name'] = $validated['name'];
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $count = 1;
            while (FilmRole::where('film_id', $filmId)->where('slug', $slug)->where('id', '!=', $roleId)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            $data['slug'] = $slug;
        }
        if (isset($validated['description'])) $data['description'] = $validated['description'];
        if (isset($validated['permissions'])) $data['permissions'] = $validated['permissions'];

        $role->update($data);

        return response()->json($role);
    }

    public function destroy(Request $request, $filmId, $roleId)
    {
        $role = FilmRole::where('film_id', $filmId)->findOrFail($roleId);

        $filmUser = $this->getFilmUser($filmId, $request->user()->id);
        $this->requireAdmin($filmUser, $request->user());

        if ($role->is_admin) {
            return response()->json(['message' => 'Cannot delete the Admin role.'], 403);
        }

        if ($role->filmUsers()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a role that has users assigned. Reassign users first.'], 409);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function availablePermissions()
    {
        $groups = \App\Services\PermissionService::getAvailablePermissions();
        $labelMap = [
            'film.view' => 'View Film', 'film.edit' => 'Edit Film Details',
            'film.invite_users' => 'Invite Users', 'film.manage_roles' => 'Manage Roles',
            'schedule.view' => 'View Schedule', 'schedule.create' => 'Create Schedule Days',
            'schedule.edit' => 'Edit Schedule', 'schedule.delete' => 'Delete Schedule',
            'scene.view' => 'View Scenes', 'scene.create' => 'Create Scenes',
            'scene.edit' => 'Edit Scenes', 'scene.delete' => 'Delete Scenes',
            'script.view' => 'View Scripts', 'script.create' => 'Upload Scripts',
            'script.edit' => 'Edit Scripts', 'script.delete' => 'Delete Scripts',
            'script_breakdown.view' => 'View Breakdown', 'script_breakdown.create' => 'Add Breakdown Items',
            'script_breakdown.edit' => 'Edit Breakdown', 'script_breakdown.delete' => 'Delete Breakdown',
            'shot_list.view' => 'View Shot List', 'shot_list.create' => 'Add Shots',
            'shot_list.edit' => 'Edit Shots', 'shot_list.delete' => 'Delete Shots',
            'cast_crew.view' => 'View Cast & Crew', 'cast_crew.create' => 'Add Cast/Crew',
            'cast_crew.edit' => 'Edit Cast/Crew', 'cast_crew.delete' => 'Delete Cast/Crew',
            'budget.view' => 'View Budget', 'budget.manage' => 'Manage Budgets',
            'expense.create' => 'Add Expenses', 'expense.edit' => 'Edit Expenses',
            'expense.delete' => 'Delete Expenses', 'expense.approve' => 'Approve Expenses',
            'call_sheet.view' => 'View Call Sheets', 'call_sheet.create' => 'Create Call Sheets',
            'call_sheet.edit' => 'Edit Call Sheets', 'call_sheet.delete' => 'Delete Call Sheets',
            'progress.view' => 'View Progress', 'progress.create' => 'Add Progress',
            'progress.edit' => 'Edit Progress', 'progress.delete' => 'Delete Progress',
            'location.view' => 'View Locations', 'location.create' => 'Add Locations',
            'location.edit' => 'Edit Locations', 'location.delete' => 'Delete Locations',
            'task.view' => 'View Tasks', 'task.create' => 'Create Tasks',
            'task.edit' => 'Edit Tasks', 'task.delete' => 'Delete Tasks',
            'timesheet.view' => 'View Time Sheets', 'timesheet.create' => 'Submit Time Sheets',
            'timesheet.edit' => 'Edit Time Sheets', 'timesheet.delete' => 'Delete Time Sheets',
            'timesheet.approve' => 'Approve Time Sheets',
            'dpr.view' => 'View DPR', 'dpr.create' => 'Create DPR',
            'dpr.edit' => 'Edit DPR', 'dpr.delete' => 'Delete DPR',
            'document.view' => 'View Documents', 'document.create' => 'Upload Documents',
            'document.edit' => 'Edit Documents', 'document.delete' => 'Delete Documents',
            'message.view' => 'View Messages', 'message.create' => 'Send Messages',
            'message.delete' => 'Delete Messages',
            'wardrobe.view' => 'View Wardrobe', 'wardrobe.create' => 'Add Wardrobe Items',
            'wardrobe.edit' => 'Edit Wardrobe', 'wardrobe.delete' => 'Delete Wardrobe',
            'continuity.view' => 'View Continuity', 'continuity.create' => 'Add Continuity',
            'continuity.edit' => 'Edit Continuity', 'continuity.delete' => 'Delete Continuity',
            'vendor.view' => 'View Vendors', 'vendor.create' => 'Add Vendors',
            'vendor.edit' => 'Edit Vendors', 'vendor.delete' => 'Delete Vendors',
            'notification.view' => 'View Notifications', 'notification.mark_read' => 'Mark Notifications Read',
        ];

        $result = [];
        foreach ($groups as $group => $keys) {
            foreach ($keys as $key) {
                $result[] = [
                    'key' => $key,
                    'label' => $labelMap[$key] ?? $key,
                    'group' => $group,
                ];
            }
        }

        return response()->json($result);
    }
}
