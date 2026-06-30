<?php

namespace App\Jobs;

use App\Models\Schedule;
use App\Services\DPRService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateDPR implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $yesterday = now()->subDay()->toDateString();

        $schedules = Schedule::where('shoot_date', $yesterday)
            ->where('status', 'Completed')
            ->get();

        $dprService = app(DPRService::class);

        foreach ($schedules as $schedule) {
            try {
                $dprService->generateForSchedule($schedule);
            } catch (\Exception $e) {
                \Log::error("[GenerateDPR] Failed for schedule {$schedule->id}: {$e->getMessage()}");
            }
        }
    }
}
