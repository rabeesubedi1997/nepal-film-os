<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\GenerateDailyCallSheet;
use App\Jobs\GenerateDPR;
use App\Jobs\SendCallSheetNotifications;
use App\Jobs\FetchFilmNews;

Schedule::command('inspire')->hourly();

Schedule::job(new GenerateDailyCallSheet)->dailyAt('05:00');
Schedule::job(new GenerateDPR)->dailyAt('23:00');
Schedule::job(new SendCallSheetNotifications)->everyFiveMinutes();
Schedule::job(new FetchFilmNews)->hourly();
