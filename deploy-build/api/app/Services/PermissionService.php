<?php

namespace App\Services;

use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PermissionService
{
    /**
     * Full authorization pipeline for a film-scoped action.
     *
     * 1. Authenticate user
     * 2. Resolve the active Film
     * 3. Verify user belongs to that Film
     * 4. Verify the Film has the requested Feature enabled
     * 5. Load the user's role for that Film
     * 6. Check the role's permissions
     * 7. Allow or deny
     */
    public function authorize(Request $request, Film $film, ?string $permission = null, ?string $module = null): bool
    {
        $user = $request->user();
        if (!$user) return false;

        // Step 1: Super Admin bypass
        if ($user->is_super_admin) return true;

        // Step 2: Get film membership
        $filmUser = $this->getFilmUser($user->id, $film->id);
        if (!$filmUser) return false;

        // Step 3: Check module enabled (if specified)
        if ($module && !$this->isModuleEnabled($film, $module)) return false;

        // Step 4: Film Admin bypass
        if ($filmUser->filmRole && $filmUser->filmRole->is_admin) return true;

        // Step 5: Permission check (if specified)
        if ($permission && !$filmUser->hasPermission($permission)) return false;

        return true;
    }

    public function requireCan(Request $request, Film $film, ?string $permission = null, ?string $module = null): void
    {
        if (!$this->authorize($request, $film, $permission, $module)) {
            abort(403, $permission
                ? "Missing required permission: {$permission}"
                : 'Access denied to this film.');
        }
    }

    public function getFilmUser(int $userId, int $filmId): ?FilmUser
    {
        return FilmUser::with('filmRole')
            ->where('user_id', $userId)
            ->where('film_id', $filmId)
            ->where('is_active', true)
            ->first();
    }

    public function isModuleEnabled(Film $film, string $moduleName): bool
    {
        return $film->isModuleEnabled($moduleName);
    }

    public function getUserPermissionsForFilm(User $user, int $filmId): array
    {
        $filmUser = $this->getFilmUser($user->id, $filmId);
        if (!$filmUser) return [];

        if ($filmUser->filmRole && $filmUser->filmRole->is_admin) return ['*'];
        if ($filmUser->filmRole) return $filmUser->filmRole->permissions ?? [];

        return $filmUser->permissions ?? [];
    }

    public function getUserRoleForFilm(User $user, int $filmId): ?FilmRole
    {
        $filmUser = $this->getFilmUser($user->id, $filmId);
        return $filmUser?->filmRole;
    }

    public function isFilmAdmin(User $user, int $filmId): bool
    {
        $filmUser = $this->getFilmUser($user->id, $filmId);
        return $filmUser && $filmUser->filmRole && $filmUser->filmRole->is_admin;
    }

    /**
     * Log a significant action to the audit trail.
     */
    public function logAudit(
        User $user,
        ?Film $film,
        string $action,
        string $module,
        string $recordType,
        ?int $recordId = null,
        ?array $oldValue = null,
        ?array $newValue = null
    ): ActivityLog {
        return ActivityLog::create([
            'film_id' => $film?->id,
            'user_id' => $user->id,
            'action' => $action,
            'module' => $module,
            'record_type' => $recordType,
            'record_id' => $recordId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Return all available permission keys grouped by module.
     * Single source of truth — used by backend and frontend.
     */
    public static function getAvailablePermissions(): array
    {
        return [
            'Film' => ['film.view', 'film.edit', 'film.invite_users', 'film.manage_roles'],
            'Schedule' => ['schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete'],
            'Scenes' => ['scene.view', 'scene.create', 'scene.edit', 'scene.delete'],
            'Script' => ['script.view', 'script.create', 'script.edit', 'script.delete'],
            'Script Breakdown' => ['script_breakdown.view', 'script_breakdown.create', 'script_breakdown.edit', 'script_breakdown.delete'],
            'Shot List' => ['shot_list.view', 'shot_list.create', 'shot_list.edit', 'shot_list.delete'],
            'Cast & Crew' => ['cast_crew.view', 'cast_crew.create', 'cast_crew.edit', 'cast_crew.delete'],
            'Budget' => ['budget.view', 'budget.manage'],
            'Expenses' => ['expense.create', 'expense.edit', 'expense.delete', 'expense.approve'],
            'Call Sheet' => ['call_sheet.view', 'call_sheet.create', 'call_sheet.edit', 'call_sheet.delete'],
            'Progress' => ['progress.view', 'progress.create', 'progress.edit', 'progress.delete'],
            'Locations' => ['location.view', 'location.create', 'location.edit', 'location.delete'],
            'Tasks' => ['task.view', 'task.create', 'task.edit', 'task.delete'],
            'Time Sheets' => ['timesheet.view', 'timesheet.create', 'timesheet.edit', 'timesheet.delete', 'timesheet.approve'],
            'DPR' => ['dpr.view', 'dpr.create', 'dpr.edit', 'dpr.delete'],
            'Documents' => ['document.view', 'document.create', 'document.edit', 'document.delete'],
            'Messaging' => ['message.view', 'message.create', 'message.delete'],
            'Wardrobe' => ['wardrobe.view', 'wardrobe.create', 'wardrobe.edit', 'wardrobe.delete'],
            'Continuity' => ['continuity.view', 'continuity.create', 'continuity.edit', 'continuity.delete'],
            'Vendors' => ['vendor.view', 'vendor.create', 'vendor.edit', 'vendor.delete'],
            'Notifications' => ['notification.view', 'notification.mark_read'],
        ];
    }

    /**
     * Get all available module/feature keys (derived from permission groups).
     */
    public static function getAvailableModules(): array
    {
        return [
            'schedule', 'cast_crew', 'expenses', 'call_sheet', 'progress',
            'locations', 'script', 'script_breakdown', 'shot_list', 'tasks',
            'timesheets', 'dpr', 'documents', 'messaging', 'wardrobe',
            'continuity', 'storyboard', 'production_calendar', 'day_out_of_days',
            'reports', 'analytics', 'vendors',
        ];
    }
}
