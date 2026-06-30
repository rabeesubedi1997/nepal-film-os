<?php

namespace App\Console\Commands;

use App\Models\Film;
use App\Models\FilmModule;
use Illuminate\Console\Command;

class RepairFilmModules extends Command
{
    protected $signature = 'films:repair-modules';
    protected $description = 'Enable all 15 default modules for existing films that may be missing some';

    public function handle()
    {
        $defaultModules = [
            'schedule', 'cast_crew', 'expenses', 'call_sheet', 'progress', 'locations',
            'script_breakdown', 'shot_list', 'tasks', 'timesheets', 'dpr', 'documents',
            'messaging', 'wardrobe', 'continuity', 'storyboard', 'production_calendar',
            'day_out_of_days', 'reports', 'analytics',
        ];

        $films = Film::where('is_active', true)->get();
        $bar = $this->output->createProgressBar($films->count());
        $bar->start();

        $fixed = 0;
        foreach ($films as $film) {
            $existing = FilmModule::where('film_id', $film->id)->pluck('module_name')->toArray();
            $missing = array_diff($defaultModules, $existing);

            foreach ($missing as $module) {
                FilmModule::create([
                    'film_id' => $film->id,
                    'module_name' => $module,
                    'is_enabled' => true,
                ]);
            }

            if (count($missing) > 0) {
                $fixed++;
                $this->info(" Film #{$film->id} ({$film->title}): +" . implode(', ', $missing));
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. {$fixed} film(s) fixed.");
    }
}
