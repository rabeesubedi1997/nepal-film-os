<?php

namespace App\Console\Commands;

use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use Illuminate\Console\Command;

class RepairFilmRoles extends Command
{
    protected $signature = 'films:repair-roles';
    protected $description = 'Create default Admin role for films that do not have one';

    public function handle()
    {
        $films = Film::where('is_active', true)->get();

        foreach ($films as $film) {
            $adminRole = FilmRole::where('film_id', $film->id)->where('is_admin', true)->first();

            if (!$adminRole) {
                $adminRole = FilmRole::create([
                    'film_id' => $film->id,
                    'name' => 'Admin',
                    'slug' => 'admin',
                    'description' => 'Full access to all film features and settings',
                    'is_admin' => true,
                    'permissions' => [],
                    'created_by' => $film->created_by,
                ]);
                $this->info("Created Admin role for film: {$film->title}");
            }

            // Assign role_id to existing film_users and update role names
            $usersWithoutRole = FilmUser::where('film_id', $film->id)
                ->whereNull('role_id')
                ->get();

            foreach ($usersWithoutRole as $fu) {
                if ($fu->role === 'Producer' || $fu->role === 'Super Admin') {
                    $fu->update(['role_id' => $adminRole->id, 'role' => 'Admin']);
                    $this->line("  → Assigned Admin role to user {$fu->user_id} (was: {$fu->role})");
                }
            }
        }

        $this->info('Done! Run `php artisan db:seed` to refresh role assignments.');
    }
}
