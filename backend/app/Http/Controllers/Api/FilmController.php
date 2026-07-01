<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use App\Models\FilmModule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class FilmController extends Controller
{
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

            // Create default Admin role for this film
            $adminRole = FilmRole::create([
                'film_id' => $film->id,
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full access to all film features and settings',
                'is_admin' => true,
                'permissions' => [],
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

        // Include permissions from the role
        if ($filmUser->filmRole) {
            $film->user_permissions = $filmUser->filmRole->permissions;
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
                'password' => bcrypt('password'),
                'is_active' => true,
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

        return response()->json([
            'message' => 'User invited successfully.',
            'user' => $targetUser,
            'film_user' => $filmUser->load('filmRole')
        ]);
    }
}
