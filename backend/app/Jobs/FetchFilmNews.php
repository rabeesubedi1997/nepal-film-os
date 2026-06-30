<?php

namespace App\Jobs;

use App\Services\NewsAggregatorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class FetchFilmNews implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $service = app(NewsAggregatorService::class);
        $articles = $service->fetchAll();

        if (!empty($articles)) {
            \Cache::put('film_news', $articles, now()->addHour());
            \Log::info('[FetchFilmNews] Fetched ' . count($articles) . ' articles.');
        }
    }
}
