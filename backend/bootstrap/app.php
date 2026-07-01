<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\RepairFilmRoles::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'film.access' => \App\Http\Middleware\FilmAccessMiddleware::class,
            'film.role' => \App\Http\Middleware\FilmRoleMiddleware::class,
            'film.module' => \App\Http\Middleware\ModuleEnabledMiddleware::class,
            'super.admin' => \App\Http\Middleware\SuperAdminMiddleware::class,
        ]);

        // Allow requests from the Vite dev server
        $middleware->validateCsrfTokens(except: ['api/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
