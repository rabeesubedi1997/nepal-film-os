<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\User;
use App\Models\FilmUser;
use App\Models\SubscriptionPlan;
use App\Models\FilmSubscription;
use Illuminate\Http\Request;

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
            'total_film_users' => $totalFilmUsers,
        ]);
    }

    public function films(Request $request)
    {
        $films = Film::withCount('users', 'modules', 'schedules', 'expenses')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($films);
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
        $users = User::withCount(['films', 'createdFilms'])->orderBy('created_at', 'desc')->get();

        return response()->json($users);
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
            'role' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role' => 'nullable|string',
        ]);

        $data = [];
        if (isset($validated['name'])) $data['name'] = $validated['name'];
        if (isset($validated['email'])) $data['email'] = $validated['email'];
        if (!empty($validated['password'])) $data['password'] = bcrypt($validated['password']);

        $user->update($data);

        return response()->json($user);
    }

    public function destroyUser($id)
    {
        $user = User::findOrFail($id);
        $user->films()->detach();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    // Film Subscriptions
    public function filmSubscriptions()
    {
        $subscriptions = FilmSubscription::with(['film', 'plan'])->get();

        return response()->json($subscriptions);
    }
}
