<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use App\Models\FilmModule;
use App\Models\User;
use App\Mail\FilmInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class FilmController extends Controller
{
    use FilmPermissionTrait;
    /**
     * List all films the user belongs to.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $films = Film::whereHas('users', function ($query) use ($userId) {
            $query->where('users.id', $userId)->where('film_users.is_active', true);
        })->with(['modules' => function ($query) {
            $query->where('is_enabled', true);
        }])->get();

        // Append user's role on each film
        $films->each(function ($film) use ($userId) {
            $pivot = FilmUser::where('film_id', $film->id)->where('user_id', $userId)->first();
            $film->user_role = $pivot ? $pivot->role : null;
            $film->user_department = $pivot ? $pivot->department : null;
        });

        return response()->json($films);
    }

    /**
     * Create a new film workspace.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'poster_image' => 'nullable|string',
            'genre' => 'nullable|string',
            'language' => 'nullable|string',
            'production_company' => 'nullable|string',
            'start_date' => 'nullable|date',
            'expected_wrap_date' => 'nullable|date',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user) {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $count = 1;
            while (Film::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }

            $film = Film::create([
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'poster_image' => $validated['poster_image'] ?? null,
                'genre' => $validated['genre'] ?? null,
                'language' => $validated['language'] ?? 'Nepali',
                'production_company' => $validated['production_company'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'expected_wrap_date' => $validated['expected_wrap_date'] ?? null,
                'is_active' => true,
                'created_by' => $user->id,
            ]);

            // Create default roles for this film
            $adminRole = FilmRole::create([
                'film_id' => $film->id,
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full access to all film features and settings',
                'is_admin' => true,
                'permissions' => [],
                'created_by' => $user->id,
            ]);

            FilmRole::create([
                'film_id' => $film->id,
                'name' => 'Editor',
                'slug' => 'editor',
                'description' => 'Can create and edit content in all modules',
                'is_admin' => false,
                'permissions' => [
                    'film.view', 'film.edit',
                    'schedule.view', 'schedule.create', 'schedule.edit',
                    'scene.view', 'scene.create', 'scene.edit',
                    'script.view', 'script.create', 'script.edit',
                    'script_breakdown.view', 'script_breakdown.create', 'script_breakdown.edit',
                    'shot_list.view', 'shot_list.create', 'shot_list.edit',
                    'cast_crew.view', 'cast_crew.create', 'cast_crew.edit',
                    'budget.view', 'budget.manage',
                    'expense.create', 'expense.edit',
                    'call_sheet.view', 'call_sheet.create', 'call_sheet.edit',
                    'progress.view', 'progress.create', 'progress.edit',
                    'location.view', 'location.create', 'location.edit',
                    'task.view', 'task.create', 'task.edit',
                    'timesheet.view', 'timesheet.create', 'timesheet.edit',
                    'dpr.view', 'dpr.create', 'dpr.edit',
                    'document.view', 'document.create', 'document.edit',
                    'message.view', 'message.create',
                    'wardrobe.view', 'wardrobe.create', 'wardrobe.edit',
                    'continuity.view', 'continuity.create', 'continuity.edit',
                    'vendor.view', 'vendor.create', 'vendor.edit',
                    'notification.view', 'notification.mark_read',
                ],
                'created_by' => $user->id,
            ]);

            FilmRole::create([
                'film_id' => $film->id,
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to all modules',
                'is_admin' => false,
                'permissions' => [
                    'film.view',
                    'schedule.view', 'scene.view',
                    'script.view',
                    'script_breakdown.view',
                    'shot_list.view',
                    'cast_crew.view',
                    'budget.view',
                    'call_sheet.view',
                    'progress.view',
                    'location.view',
                    'task.view',
                    'timesheet.view',
                    'dpr.view',
                    'document.view',
                    'message.view',
                    'wardrobe.view',
                    'continuity.view',
                    'vendor.view',
                    'notification.view', 'notification.mark_read',
                ],
                'created_by' => $user->id,
            ]);

            // Assign creator as Admin
            FilmUser::create([
                'film_id' => $film->id,
                'user_id' => $user->id,
                'role' => 'Admin',
                'role_id' => $adminRole->id,
                'department' => 'Production',
                'is_active' => true,
                'joined_at' => now(),
            ]);

            // Enable default modules
            $defaultModules = [
                'schedule', 'cast_crew', 'expenses', 'call_sheet', 'progress', 'locations',
                'script', 'script_breakdown', 'shot_list', 'tasks', 'timesheets', 'dpr', 'documents',
                'messaging', 'wardrobe', 'continuity', 'storyboard', 'production_calendar',
                'day_out_of_days', 'reports', 'analytics',
            ];
            foreach ($defaultModules as $module) {
                FilmModule::create([
                    'film_id' => $film->id,
                    'module_name' => $module,
                    'is_enabled' => true,
                ]);
            }

            $film->load('modules');
            $film->user_role = 'Admin';
            $film->user_department = 'Production';

            return response()->json($film, 201);
        });
    }

    /**
     * Show detailed film workspace context.
     */
    public function show(Request $request, $id)
    {
        // Support ID or slug
        $film = is_numeric($id)
            ? Film::with(['modules', 'users'])->find($id)
            : Film::with(['modules', 'users'])->where('slug', $id)->first();

        if (!$film || !$film->is_active) {
            return response()->json(['message' => 'Film workspace not found.'], 404);
        }

        // Check if caller belongs to film
        $filmUser = FilmUser::with('filmRole')
            ->where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$filmUser) {
            return response()->json(['message' => 'Unauthorized access to film.'], 403);
        }

        $film->user_role = $filmUser->role;
        $film->user_department = $filmUser->department;
        $film->user_role_id = $filmUser->role_id;

        // Merge role permissions with individual user-level overrides
        if ($filmUser->filmRole) {
            $rolePerms = $filmUser->filmRole->permissions ?? [];
            $userPerms = $filmUser->permissions ?? [];
            $film->user_permissions = array_values(array_unique(array_merge($rolePerms, $userPerms)));
            $film->user_is_admin = $filmUser->filmRole->is_admin;
        } else {
            $film->user_permissions = [];
            $film->user_is_admin = false;
        }

        return response()->json($film);
    }

    /**
     * Update film workspace details.
     */
    public function update(Request $request, $filmId)
    {
        $film = Film::findOrFail($filmId);

        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canUpdate = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $filmUser->hasPermission('film.edit') ||
            $request->user()->is_super_admin
        );

        if (!$canUpdate) {
            return response()->json(['message' => 'Unauthorized to update film.'], 403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'poster_image' => 'nullable|string',
            'genre' => 'nullable|string',
            'language' => 'nullable|string',
            'production_company' => 'nullable|string',
            'status' => 'nullable|string',
            'start_date' => 'nullable|date',
            'expected_wrap_date' => 'nullable|date',
        ]);

        if (isset($validated['title'])) {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $count = 1;
            while (Film::where('slug', $slug)->where('id', '!=', $film->id)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            $validated['slug'] = $slug;
        }

        $film->update($validated);

        return response()->json($film->load('modules'));
    }

    /**
     * Delete a film workspace (soft).
     */
    public function destroy(Request $request, $filmId)
    {
        $film = Film::findOrFail($filmId);

        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canDelete = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $request->user()->is_super_admin
        );

        if (!$canDelete) {
            return response()->json(['message' => 'Unauthorized to delete film.'], 403);
        }

        $film->update(['is_active' => false]);

        return response()->json(['message' => 'Film workspace deactivated.']);
    }

    /**
     * Toggle status of a module.
     */
    public function toggleModule(Request $request, $filmId)
    {
        $validated = $request->validate([
            'module_name' => 'required|string',
            'is_enabled' => 'required|boolean',
        ]);

        $film = Film::findOrFail($filmId);

        // Check if user is Producer or Super Admin
        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canToggle = $filmUser && (
            $filmUser->isFilmAdmin() ||
            $request->user()->is_super_admin
        );

        if (!$canToggle) {
            return response()->json(['message' => 'Unauthorized to modify film modules.'], 403);
        }

        $module = FilmModule::updateOrCreate(
            ['film_id' => $film->id, 'module_name' => $validated['module_name']],
            ['is_enabled' => $validated['is_enabled']]
        );

        return response()->json([
            'message' => "Module status updated.",
            'module' => $module
        ]);
    }

    /**
     * Invite/Assign user to film workspace.
     */
    public function inviteUser(Request $request, $filmId)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'role_id' => 'required|integer|exists:film_roles,id',
            'role' => 'nullable|string',
            'department' => 'nullable|string',
        ]);

        $film = Film::findOrFail($filmId);

        // Check if inviting user is Film Admin
        $callerUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canInvite = $callerUser && (
            $callerUser->isFilmAdmin() ||
            $callerUser->hasPermission('film.invite_users') ||
            $request->user()->is_super_admin
        );

        if (!$canInvite) {
            return response()->json(['message' => 'Unauthorized to invite users.'], 403);
        }

        // Verify role belongs to this film
        $filmRole = FilmRole::where('id', $validated['role_id'])
            ->where('film_id', $film->id)
            ->first();

        if (!$filmRole) {
            return response()->json(['message' => 'Invalid role for this film.'], 422);
        }

        $targetUser = User::where('email', $validated['email'])->first();

        if (!$targetUser) {
            $targetUser = User::create([
                'name' => explode('@', $validated['email'])[0],
                'email' => $validated['email'],
                'password' => bcrypt(Str::random(24)),
                'is_active' => true,
            ]);
        }

        if (!$targetUser->invitation_token || $targetUser->invitation_token_expires_at < now()) {
            $targetUser->update([
                'invitation_token' => Str::random(60),
                'invitation_token_expires_at' => now()->addDays(7),
            ]);
        }

        $filmUser = FilmUser::updateOrCreate(
            ['film_id' => $film->id, 'user_id' => $targetUser->id],
            [
                'role' => $filmRole->name,
                'role_id' => $filmRole->id,
                'department' => $validated['department'] ?? null,
                'is_active' => true,
                'joined_at' => now(),
            ]
        );

        // Send invitation email (best effort)
        try {
            Mail::to($targetUser->email)->send(new FilmInvitationMail(
                $targetUser,
                $film,
                $filmRole,
                $targetUser->invitation_token,
            ));
        } catch (\Exception $e) {
            \Log::error('Invite email failed: ' . $e->getMessage(), [
                'email' => $targetUser->email,
                'film_id' => $film->id,
                'trace' => $e->getTraceAsString()
            ]);
        }

        return response()->json([
            'message' => 'User invited successfully.',
            'user' => $targetUser,
            'film_user' => $filmUser->load('filmRole')
        ]);
    }

    /**
     * List all members of a film.
     */
    public function members(Request $request, $filmId)
    {
        $members = FilmUser::where('film_id', $filmId)
            ->with(['user', 'filmRole'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($fu) {
                return [
                    'id' => $fu->id,
                    'user_id' => $fu->user_id,
                    'name' => $fu->user->name ?? 'Unknown',
                    'email' => $fu->user->email ?? '',
                    'role' => $fu->role,
                    'role_id' => $fu->role_id,
                    'role_name' => $fu->filmRole->name ?? $fu->role,
                    'role_slug' => $fu->filmRole->slug ?? null,
                    'is_admin' => $fu->filmRole->is_admin ?? false,
                    'department' => $fu->department,
                    'permissions' => $fu->permissions,
                    'is_active' => $fu->is_active,
                    'joined_at' => $fu->joined_at,
                    'avatar' => $fu->user->avatar ?? null,
                ];
            });

        return response()->json($members);
    }

    /**
     * Update a member's role or department.
     */
    public function updateMember(Request $request, $filmId, $userId)
    {
        $film = Film::findOrFail($filmId);

        $callerUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canManage = $callerUser && (
            $callerUser->isFilmAdmin() ||
            $callerUser->hasPermission('film.manage_roles') ||
            $request->user()->is_super_admin
        );

        if (!$canManage) {
            return response()->json(['message' => 'Unauthorized to manage members.'], 403);
        }

        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Cannot modify the creator's admin role
        if ($film->created_by === (int) $userId && $filmUser->isFilmAdmin()) {
            return response()->json(['message' => 'Cannot modify the film creator\'s admin role.'], 403);
        }

        $validated = $request->validate([
            'role_id' => 'nullable|integer|exists:film_roles,id',
            'department' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        if (isset($validated['role_id'])) {
            $filmRole = FilmRole::where('id', $validated['role_id'])
                ->where('film_id', $film->id)
                ->firstOrFail();
            $validated['role'] = $filmRole->name;
        }

        $filmUser->update($validated);

        return response()->json([
            'message' => 'Member updated.',
            'member' => $filmUser->load('filmRole')
        ]);
    }

    /**
     * Remove a member from a film.
     */
    public function removeMember(Request $request, $filmId, $userId)
    {
        $film = Film::findOrFail($filmId);

        $callerUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canManage = $callerUser && (
            $callerUser->isFilmAdmin() ||
            $callerUser->hasPermission('film.manage_roles') ||
            $request->user()->is_super_admin
        );

        if (!$canManage) {
            return response()->json(['message' => 'Unauthorized to manage members.'], 403);
        }

        if ((int) $userId === $request->user()->id) {
            return response()->json(['message' => 'Cannot remove yourself.'], 403);
        }

        $filmUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($film->created_by === (int) $userId) {
            return response()->json(['message' => 'Cannot remove the film creator.'], 403);
        }

        $filmUser->delete();

        return response()->json(['message' => 'Member removed from film.']);
    }

    /**
     * Create a new user and assign to film (film admin version).
     */
    public function addMember(Request $request, $filmId)
    {
        $film = Film::findOrFail($filmId);

        $callerUser = FilmUser::where('film_id', $film->id)
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        $canInvite = $callerUser && (
            $callerUser->isFilmAdmin() ||
            $callerUser->hasPermission('film.invite_users') ||
            $request->user()->is_super_admin
        );

        if (!$canInvite) {
            return response()->json(['message' => 'Unauthorized to add members.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|integer|exists:film_roles,id',
            'department' => 'nullable|string|max:255',
        ]);

        // Verify role belongs to this film
        $filmRole = FilmRole::where('id', $validated['role_id'])
            ->where('film_id', $film->id)
            ->firstOrFail();

        $targetUser = User::where('email', $validated['email'])->first();

        if ($targetUser) {
            // Check if already a member
            $existing = FilmUser::where('film_id', $film->id)
                ->where('user_id', $targetUser->id)
                ->first();
            if ($existing) {
                return response()->json(['message' => 'User is already a member of this film.'], 409);
            }
        } else {
            $targetUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt(Str::random(24)),
                'is_active' => true,
            ]);
        }

        if (!$targetUser->invitation_token || $targetUser->invitation_token_expires_at < now()) {
            $targetUser->update([
                'invitation_token' => Str::random(60),
                'invitation_token_expires_at' => now()->addDays(7),
            ]);
        }

        $filmUser = FilmUser::create([
            'film_id' => $film->id,
            'user_id' => $targetUser->id,
            'role' => $filmRole->name,
            'role_id' => $filmRole->id,
            'department' => $validated['department'] ?? null,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        // Send invitation email (best effort)
        try {
            Mail::to($targetUser->email)->send(new FilmInvitationMail(
                $targetUser,
                $film,
                $filmRole,
                $targetUser->invitation_token,
            ));
        } catch (\Exception $e) {
            \Log::error('Invite email failed: ' . $e->getMessage(), [
                'email' => $targetUser->email,
                'film_id' => $film->id,
                'trace' => $e->getTraceAsString()
            ]);
        }

        return response()->json([
            'message' => 'Member added successfully.',
            'user' => $targetUser,
            'film_user' => $filmUser->load('filmRole')
        ], 201);
    }
}
