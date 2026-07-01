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

    private function requireAdmin($filmUser)
    {
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
        $this->requireAdmin($filmUser);

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
        $this->requireAdmin($filmUser);

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
        $this->requireAdmin($filmUser);

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
        $permissions = [
            ['key' => 'film.view', 'label' => 'View Film', 'group' => 'Film'],
            ['key' => 'film.edit', 'label' => 'Edit Film Details', 'group' => 'Film'],
            ['key' => 'film.invite_users', 'label' => 'Invite Users', 'group' => 'Film'],
            ['key' => 'film.manage_roles', 'label' => 'Manage Roles', 'group' => 'Film'],

            ['key' => 'schedule.view', 'label' => 'View Schedule', 'group' => 'Schedule'],
            ['key' => 'schedule.create', 'label' => 'Create Schedule Days', 'group' => 'Schedule'],
            ['key' => 'schedule.edit', 'label' => 'Edit Schedule', 'group' => 'Schedule'],
            ['key' => 'schedule.delete', 'label' => 'Delete Schedule', 'group' => 'Schedule'],

            ['key' => 'scene.view', 'label' => 'View Scenes', 'group' => 'Scenes'],
            ['key' => 'scene.create', 'label' => 'Create Scenes', 'group' => 'Scenes'],
            ['key' => 'scene.edit', 'label' => 'Edit Scenes', 'group' => 'Scenes'],
            ['key' => 'scene.delete', 'label' => 'Delete Scenes', 'group' => 'Scenes'],

            ['key' => 'script.view', 'label' => 'View Scripts', 'group' => 'Script'],
            ['key' => 'script.create', 'label' => 'Upload Scripts', 'group' => 'Script'],
            ['key' => 'script.edit', 'label' => 'Edit Scripts', 'group' => 'Script'],
            ['key' => 'script.delete', 'label' => 'Delete Scripts', 'group' => 'Script'],

            ['key' => 'script_breakdown.view', 'label' => 'View Breakdown', 'group' => 'Script Breakdown'],
            ['key' => 'script_breakdown.create', 'label' => 'Add Breakdown Items', 'group' => 'Script Breakdown'],
            ['key' => 'script_breakdown.edit', 'label' => 'Edit Breakdown', 'group' => 'Script Breakdown'],
            ['key' => 'script_breakdown.delete', 'label' => 'Delete Breakdown', 'group' => 'Script Breakdown'],

            ['key' => 'shot_list.view', 'label' => 'View Shot List', 'group' => 'Shot List'],
            ['key' => 'shot_list.create', 'label' => 'Add Shots', 'group' => 'Shot List'],
            ['key' => 'shot_list.edit', 'label' => 'Edit Shots', 'group' => 'Shot List'],
            ['key' => 'shot_list.delete', 'label' => 'Delete Shots', 'group' => 'Shot List'],

            ['key' => 'cast_crew.view', 'label' => 'View Cast & Crew', 'group' => 'Cast & Crew'],
            ['key' => 'cast_crew.create', 'label' => 'Add Cast/Crew', 'group' => 'Cast & Crew'],
            ['key' => 'cast_crew.edit', 'label' => 'Edit Cast/Crew', 'group' => 'Cast & Crew'],
            ['key' => 'cast_crew.delete', 'label' => 'Delete Cast/Crew', 'group' => 'Cast & Crew'],

            ['key' => 'budget.view', 'label' => 'View Budget', 'group' => 'Budget'],
            ['key' => 'budget.manage', 'label' => 'Manage Budgets', 'group' => 'Budget'],

            ['key' => 'expense.create', 'label' => 'Add Expenses', 'group' => 'Expenses'],
            ['key' => 'expense.edit', 'label' => 'Edit Expenses', 'group' => 'Expenses'],
            ['key' => 'expense.delete', 'label' => 'Delete Expenses', 'group' => 'Expenses'],
            ['key' => 'expense.approve', 'label' => 'Approve Expenses', 'group' => 'Expenses'],

            ['key' => 'call_sheet.view', 'label' => 'View Call Sheets', 'group' => 'Call Sheet'],
            ['key' => 'call_sheet.create', 'label' => 'Create Call Sheets', 'group' => 'Call Sheet'],
            ['key' => 'call_sheet.edit', 'label' => 'Edit Call Sheets', 'group' => 'Call Sheet'],
            ['key' => 'call_sheet.delete', 'label' => 'Delete Call Sheets', 'group' => 'Call Sheet'],

            ['key' => 'progress.view', 'label' => 'View Progress', 'group' => 'Progress'],
            ['key' => 'progress.create', 'label' => 'Add Progress', 'group' => 'Progress'],
            ['key' => 'progress.edit', 'label' => 'Edit Progress', 'group' => 'Progress'],
            ['key' => 'progress.delete', 'label' => 'Delete Progress', 'group' => 'Progress'],

            ['key' => 'location.view', 'label' => 'View Locations', 'group' => 'Locations'],
            ['key' => 'location.create', 'label' => 'Add Locations', 'group' => 'Locations'],
            ['key' => 'location.edit', 'label' => 'Edit Locations', 'group' => 'Locations'],
            ['key' => 'location.delete', 'label' => 'Delete Locations', 'group' => 'Locations'],

            ['key' => 'task.view', 'label' => 'View Tasks', 'group' => 'Tasks'],
            ['key' => 'task.create', 'label' => 'Create Tasks', 'group' => 'Tasks'],
            ['key' => 'task.edit', 'label' => 'Edit Tasks', 'group' => 'Tasks'],
            ['key' => 'task.delete', 'label' => 'Delete Tasks', 'group' => 'Tasks'],

            ['key' => 'timesheet.view', 'label' => 'View Time Sheets', 'group' => 'Time Sheets'],
            ['key' => 'timesheet.create', 'label' => 'Submit Time Sheets', 'group' => 'Time Sheets'],
            ['key' => 'timesheet.edit', 'label' => 'Edit Time Sheets', 'group' => 'Time Sheets'],
            ['key' => 'timesheet.delete', 'label' => 'Delete Time Sheets', 'group' => 'Time Sheets'],
            ['key' => 'timesheet.approve', 'label' => 'Approve Time Sheets', 'group' => 'Time Sheets'],

            ['key' => 'dpr.view', 'label' => 'View DPR', 'group' => 'DPR'],
            ['key' => 'dpr.create', 'label' => 'Create DPR', 'group' => 'DPR'],
            ['key' => 'dpr.edit', 'label' => 'Edit DPR', 'group' => 'DPR'],
            ['key' => 'dpr.delete', 'label' => 'Delete DPR', 'group' => 'DPR'],

            ['key' => 'document.view', 'label' => 'View Documents', 'group' => 'Documents'],
            ['key' => 'document.create', 'label' => 'Upload Documents', 'group' => 'Documents'],
            ['key' => 'document.edit', 'label' => 'Edit Documents', 'group' => 'Documents'],
            ['key' => 'document.delete', 'label' => 'Delete Documents', 'group' => 'Documents'],

            ['key' => 'message.view', 'label' => 'View Messages', 'group' => 'Messaging'],
            ['key' => 'message.create', 'label' => 'Send Messages', 'group' => 'Messaging'],
            ['key' => 'message.delete', 'label' => 'Delete Messages', 'group' => 'Messaging'],

            ['key' => 'wardrobe.view', 'label' => 'View Wardrobe', 'group' => 'Wardrobe'],
            ['key' => 'wardrobe.create', 'label' => 'Add Wardrobe Items', 'group' => 'Wardrobe'],
            ['key' => 'wardrobe.edit', 'label' => 'Edit Wardrobe', 'group' => 'Wardrobe'],
            ['key' => 'wardrobe.delete', 'label' => 'Delete Wardrobe', 'group' => 'Wardrobe'],

            ['key' => 'continuity.view', 'label' => 'View Continuity', 'group' => 'Continuity'],
            ['key' => 'continuity.create', 'label' => 'Add Continuity', 'group' => 'Continuity'],
            ['key' => 'continuity.edit', 'label' => 'Edit Continuity', 'group' => 'Continuity'],
            ['key' => 'continuity.delete', 'label' => 'Delete Continuity', 'group' => 'Continuity'],

            ['key' => 'notification.view', 'label' => 'View Notifications', 'group' => 'Notifications'],
            ['key' => 'notification.mark_read', 'label' => 'Mark Notifications Read', 'group' => 'Notifications'],
        ];

        return response()->json($permissions);
    }
}
