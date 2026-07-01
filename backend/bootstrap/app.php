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
        \App\Console\Commands\MakeSuperAdmin::class,
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
        $exceptions->shouldRenderJsonWhen(function () {
            return true;
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'An error occurred.',
            ], $e->getStatusCode());
        });

        $exceptions->render(function (\Throwable $e) {
            $debug = config('app.debug');
            return response()->json([
                'message' => $debug ? $e->getMessage() : 'An unexpected error occurred.',
            ], $debug ? 500 : 500);
        });
    })->create();
