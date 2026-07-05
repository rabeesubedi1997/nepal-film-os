<?php

namespace App\Console\Commands;

use App\Models\Film;
use App\Models\FilmRole;
use App\Models\FilmUser;
use Illuminate\Console\Command;

class RepairFilmRoles extends Command
{
    protected $signature = 'films:repair-roles';
    protected $description = 'Create default Admin, Editor, and Viewer roles for films missing them';

    public function handle()
    {
        $editorPermissions = [
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
        ];

        $viewerPermissions = [
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
        ];

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

            $editorRole = FilmRole::where('film_id', $film->id)->where('slug', 'editor')->first();
            if (!$editorRole) {
                FilmRole::create([
                    'film_id' => $film->id,
                    'name' => 'Editor',
                    'slug' => 'editor',
                    'description' => 'Can create and edit content in all modules',
                    'is_admin' => false,
                    'permissions' => $editorPermissions,
                    'created_by' => $film->created_by,
                ]);
                $this->info("Created Editor role for film: {$film->title}");
            }

            $viewerRole = FilmRole::where('film_id', $film->id)->where('slug', 'viewer')->first();
            if (!$viewerRole) {
                FilmRole::create([
                    'film_id' => $film->id,
                    'name' => 'Viewer',
                    'slug' => 'viewer',
                    'description' => 'Read-only access to all modules',
                    'is_admin' => false,
                    'permissions' => $viewerPermissions,
                    'created_by' => $film->created_by,
                ]);
                $this->info("Created Viewer role for film: {$film->title}");
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

        $this->info('Done!');
    }
}
