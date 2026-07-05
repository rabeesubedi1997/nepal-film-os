<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\User;
use App\Models\FilmUser;
use App\Models\FilmRole;
use App\Models\SubscriptionPlan;
use App\Models\FilmSubscription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    public function dashboard()
    {
        $totalFilms = Film::count();
        $activeFilms = Film::where('is_active', true)->count();
        $totalUsers = User::count();
        $totalFilmUsers = FilmUser::count();

        return response()->json([
            'total_films' => $totalFilms,
            'active_films' => $activeFilms,
            'total_users' => $totalUsers,
            'film_users' => $totalFilmUsers,
        ]);
    }

    public function films(Request $request)
    {
        $films = Film::withCount('users', 'modules', 'schedules', 'expenses')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($films);
    }

    public function storeFilm(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'genre' => 'nullable|string',
            'language' => 'nullable|string',
            'production_company' => 'nullable|string',
            'start_date' => 'nullable|date',
            'expected_wrap_date' => 'nullable|date',
            'assign_user_id' => 'nullable|integer|exists:users,id',
            'assign_role_id' => 'nullable|integer|exists:film_roles,id',
            'assign_department' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user, $request) {
            $slug = \Illuminate\Support\Str::slug($validated['title']);
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
                'genre' => $validated['genre'] ?? null,
                'language' => $validated['language'] ?? 'Nepali',
                'production_company' => $validated['production_company'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'expected_wrap_date' => $validated['expected_wrap_date'] ?? null,
                'is_active' => true,
                'created_by' => $user->id,
            ]);

            // Create default roles for this film
            $adminRole = \App\Models\FilmRole::create([
                'film_id' => $film->id,
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full access to all film features and settings',
                'is_admin' => true,
                'permissions' => [],
                'created_by' => $user->id,
            ]);

            \App\Models\FilmRole::create([
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

            \App\Models\FilmRole::create([
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

            // Assign the super admin (creator) as a member
            \App\Models\FilmUser::create([
                'film_id' => $film->id,
                'user_id' => $user->id,
                'role' => 'Super Admin',
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
                \App\Models\FilmModule::create([
                    'film_id' => $film->id,
                    'module_name' => $module,
                    'is_enabled' => true,
                ]);
            }

            // Optionally assign another user as Admin
            if (!empty($validated['assign_user_id'])) {
                $targetRoleId = $validated['assign_role_id'] ?? $adminRole->id;
                $assignRole = \App\Models\FilmRole::where('id', $targetRoleId)
                    ->where('film_id', $film->id)
                    ->first();

                if ($assignRole) {
                    \App\Models\FilmUser::create([
                        'film_id' => $film->id,
                        'user_id' => $validated['assign_user_id'],
                        'role' => $assignRole->name,
                        'role_id' => $assignRole->id,
                        'department' => $validated['assign_department'] ?? null,
                        'is_active' => true,
                        'joined_at' => now(),
                    ]);
                }
            }

            $film->load('modules');
            $film->user_role = 'Super Admin';

            return response()->json($film, 201);
        });
    }

    public function filmDetail($id)
    {
        $film = Film::with(['users', 'modules', 'creator'])
            ->withCount('schedules', 'scenes', 'expenses', 'callSheets')
            ->findOrFail($id);

        return response()->json($film);
    }

    public function users(Request $request)
    {
        $users = User::withCount(['films', 'createdFilms'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                $user->film_assignments = FilmUser::with(['film:id,title,slug', 'filmRole:id,name,is_admin'])
                    ->where('user_id', $user->id)
                    ->where('is_active', true)
                    ->get()
                    ->map(function ($fu) {
                        return [
                            'film_id' => $fu->film_id,
                            'film_title' => $fu->film?->title,
                            'film_slug' => $fu->film?->slug,
                            'role_id' => $fu->role_id,
                            'role_name' => $fu->filmRole?->name ?? $fu->role,
                            'is_admin' => $fu->filmRole?->is_admin ?? false,
                            'department' => $fu->department,
                        ];
                    });
                return $user;
            });

        return response()->json($users);
    }

    public function userDetail($id)
    {
        $user = User::findOrFail($id);

        $filmAssignments = FilmUser::with(['film:id,title,slug', 'filmRole:id,name,is_admin,permissions'])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->map(function ($fu) {
                return [
                    'film_id' => $fu->film_id,
                    'film_title' => $fu->film?->title,
                    'film_slug' => $fu->film?->slug,
                    'role_id' => $fu->role_id,
                    'role_name' => $fu->filmRole?->name ?? $fu->role,
                    'is_admin' => $fu->filmRole?->is_admin ?? false,
                    'permissions' => $fu->filmRole?->permissions ?? [],
                    'department' => $fu->department,
                    'joined_at' => $fu->joined_at,
                ];
            });

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'is_super_admin' => $user->is_super_admin,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'films_count' => $filmAssignments->count(),
            'film_assignments' => $filmAssignments,
        ]);
    }

    public function toggleFilmStatus(Request $request, $id)
    {
        $film = Film::findOrFail($id);
        $film->update(['is_active' => !$film->is_active]);

        return response()->json(['message' => 'Film status toggled.', 'is_active' => $film->is_active]);
    }

    // Subscription Plan Management
    public function subscriptionPlans()
    {
        return response()->json(SubscriptionPlan::all());
    }

    public function storeSubscriptionPlan(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price_npr' => 'required|numeric',
            'price_usd' => 'nullable|numeric',
            'billing_cycle' => 'required|string',
            'max_films' => 'nullable|integer',
            'max_users_per_film' => 'nullable|integer',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $plan = SubscriptionPlan::create($validated);

        return response()->json($plan, 201);
    }

    public function updateSubscriptionPlan(Request $request, $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'price_npr' => 'nullable|numeric',
            'price_usd' => 'nullable|numeric',
            'billing_cycle' => 'nullable|string',
            'max_films' => 'nullable|integer',
            'max_users_per_film' => 'nullable|integer',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $plan->update($validated);

        return response()->json($plan);
    }

    public function deleteSubscriptionPlan($id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $plan->subscriptions()->delete();
        $plan->delete();

        return response()->json(['message' => 'Plan deleted.']);
    }

    // User Management
    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'is_super_admin' => 'nullable|boolean',
            'film_id' => 'nullable|integer|exists:films,id',
            'role_id' => 'nullable|integer|exists:film_roles,id',
            'department' => 'nullable|string|max:255',
        ]);

        if ($validated['is_super_admin'] ?? false) {
            $existingSuperAdmins = User::where('is_super_admin', true)->count();
            if ($existingSuperAdmins > 0) {
                return response()->json([
                    'message' => 'A super admin already exists. Only one super admin account is allowed for security reasons.',
                ], 403);
            }
        }

        $user = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'is_active' => true,
                'is_super_admin' => $validated['is_super_admin'] ?? false,
            ]);

            // Auto-assign to a film if film_id and role_id are provided
            if (!empty($validated['film_id']) && !empty($validated['role_id'])) {
                $filmRole = FilmRole::where('id', $validated['role_id'])
                    ->where('film_id', $validated['film_id'])
                    ->first();

                if ($filmRole) {
                    FilmUser::create([
                        'film_id' => $validated['film_id'],
                        'user_id' => $user->id,
                        'role' => $filmRole->name,
                        'role_id' => $filmRole->id,
                        'department' => $validated['department'] ?? null,
                        'is_active' => true,
                        'joined_at' => now(),
                    ]);
                }
            }

            return $user;
        });

        $user = $user->fresh();
        $user->films_count = $user->films()->count();

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($id)],
            'password' => 'nullable|string|min:8',
            'is_super_admin' => 'nullable|boolean',
        ]);

        // Prevent creating duplicate super admin
        if (!empty($validated['is_super_admin']) && !$user->is_super_admin) {
            $existing = User::where('id', '!=', $user->id)->where('is_super_admin', true)->exists();
            if ($existing) {
                return response()->json(['message' => 'A super admin already exists.'], 409);
            }
        }

        $data = [];
        if (isset($validated['name'])) $data['name'] = $validated['name'];
        if (isset($validated['email'])) $data['email'] = $validated['email'];
        if (!empty($validated['password'])) $data['password'] = bcrypt($validated['password']);
        // Explicitly handle is_super_admin — must set even when false to allow removal
        $data['is_super_admin'] = $validated['is_super_admin'] ?? $user->is_super_admin;

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroyUser($id)
    {
        $user = User::findOrFail($id);
        $user->films()->detach();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    // User-Film Assignment
    public function assignUserToFilm(Request $request, $userId)
    {
        $validated = $request->validate([
            'film_id' => 'required|integer|exists:films,id',
            'role_id' => 'required|integer|exists:film_roles,id',
            'department' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($userId);
        $film = Film::findOrFail($validated['film_id']);

        $filmRole = FilmRole::where('id', $validated['role_id'])
            ->where('film_id', $film->id)
            ->first();

        if (!$filmRole) {
            return response()->json([
                'message' => 'The specified role does not belong to this film.',
            ], 422);
        }

        $filmUser = FilmUser::updateOrCreate(
            ['film_id' => $film->id, 'user_id' => $user->id],
            [
                'role' => $filmRole->name,
                'role_id' => $filmRole->id,
                'department' => $validated['department'] ?? null,
                'is_active' => true,
                'joined_at' => now(),
            ]
        );

        return response()->json([
            'message' => "User '{$user->name}' assigned to film '{$film->title}' with role '{$filmRole->name}'.",
            'assignment' => [
                'film_id' => $film->id,
                'film_title' => $film->title,
                'film_slug' => $film->slug,
                'role_id' => $filmRole->id,
                'role_name' => $filmRole->name,
                'is_admin' => $filmRole->is_admin,
                'department' => $filmUser->department,
                'joined_at' => $filmUser->joined_at,
            ],
        ]);
    }

    public function removeUserFromFilm(Request $request, $userId, $filmId)
    {
        $user = User::findOrFail($userId);
        $film = Film::findOrFail($filmId);

        $deleted = FilmUser::where('film_id', $film->id)
            ->where('user_id', $user->id)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => "User '{$user->name}' is not assigned to film '{$film->title}'.",
            ], 404);
        }

        return response()->json([
            'message' => "User '{$user->name}' removed from film '{$film->title}'.",
        ]);
    }

    // Film Subscriptions
    public function filmSubscriptions()
    {
        $subscriptions = FilmSubscription::with(['film', 'plan'])->get();

        return response()->json($subscriptions);
    }
}
