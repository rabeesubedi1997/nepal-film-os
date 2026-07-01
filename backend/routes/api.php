<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FilmController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\CastCrewController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\CallSheetController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ScriptBreakdownController;
use App\Http\Controllers\Api\ShotListController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TimeSheetController;
use App\Http\Controllers\Api\DailyProductionReportController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\WardrobeController;
use App\Http\Controllers\Api\ContinuityController;
use App\Http\Controllers\Api\SeriesController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\ScriptController;
use App\Http\Controllers\Api\SceneController;
use App\Http\Controllers\Api\DayOutOfDaysController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\RoleController;

// Public Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Film Workspace Routes
    Route::get('/films', [FilmController::class, 'index']);
    Route::post('/films', [FilmController::class, 'store']);

    // Super Admin Routes
    Route::middleware('super.admin')->prefix('super-admin')->group(function () {
        Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/films', [SuperAdminController::class, 'films']);
        Route::get('/films/{id}', [SuperAdminController::class, 'filmDetail']);
        Route::get('/users', [SuperAdminController::class, 'users']);
        Route::get('/users/{id}', [SuperAdminController::class, 'userDetail']);
        Route::put('/films/{id}/toggle-status', [SuperAdminController::class, 'toggleFilmStatus']);

        // User Management
        Route::post('/users', [SuperAdminController::class, 'storeUser']);
        Route::put('/users/{id}', [SuperAdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [SuperAdminController::class, 'destroyUser']);

        // User-Film Assignment
        Route::post('/users/{userId}/assign-film', [SuperAdminController::class, 'assignUserToFilm']);
        Route::delete('/users/{userId}/films/{filmId}', [SuperAdminController::class, 'removeUserFromFilm']);

        // Subscription Plans
        Route::get('/subscription-plans', [SuperAdminController::class, 'subscriptionPlans']);
        Route::post('/subscription-plans', [SuperAdminController::class, 'storeSubscriptionPlan']);
        Route::put('/subscription-plans/{id}', [SuperAdminController::class, 'updateSubscriptionPlan']);
        Route::delete('/subscription-plans/{id}', [SuperAdminController::class, 'deleteSubscriptionPlan']);

        // Film Subscriptions
        Route::get('/film-subscriptions', [SuperAdminController::class, 'filmSubscriptions']);
    });

    // Notifications (user-level, not scoped to a specific film)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Series
    Route::get('/series', [SeriesController::class, 'index']);
    Route::get('/series/{id}', [SeriesController::class, 'show']);
    Route::post('/series', [SeriesController::class, 'store']);
    Route::put('/series/{id}', [SeriesController::class, 'update']);
    Route::delete('/series/{id}', [SeriesController::class, 'destroy']);

    // Media Library
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media', [MediaController::class, 'store']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);

    // News Feed
    Route::get('/news', [NewsController::class, 'index']);
    Route::get('/news/categories', [NewsController::class, 'categories']);
    Route::get('/news/{id}', [NewsController::class, 'show']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);
    Route::post('/news/refresh', [NewsController::class, 'refresh']);
    Route::post('/news/categories', [NewsController::class, 'storeCategory']);
    Route::put('/news/categories/{id}', [NewsController::class, 'updateCategory']);
    Route::delete('/news/categories/{id}', [NewsController::class, 'destroyCategory']);

    // Routes requiring Film Access
    Route::middleware('film.access')->group(function () {
        Route::get('/films/{film}', [FilmController::class, 'show']);
        Route::put('/films/{film}', [FilmController::class, 'update']);
        Route::delete('/films/{film}', [FilmController::class, 'destroy']);

        // Modules Toggle (Producer/Admin only)
        Route::put('/films/{film}/modules', [FilmController::class, 'toggleModule']);
        Route::post('/films/{film}/invite', [FilmController::class, 'inviteUser']);

        // 1. Shooting Schedule Module (with Locations)
        Route::middleware('film.module:schedule')->group(function () {
            Route::get('/films/{film}/schedules', [ScheduleController::class, 'index']);
            Route::post('/films/{film}/schedules', [ScheduleController::class, 'storeSchedule']);
            Route::put('/films/{film}/schedules/{schedule}', [ScheduleController::class, 'updateSchedule']);
            Route::delete('/films/{film}/schedules/{schedule}', [ScheduleController::class, 'destroySchedule']);
            Route::post('/films/{film}/scenes', [ScheduleController::class, 'storeScene']);
            Route::put('/films/{film}/scenes/{scene}', [ScheduleController::class, 'updateScene']);
            Route::delete('/films/{film}/scenes/{scene}', [ScheduleController::class, 'destroyScene']);
            Route::post('/films/{film}/schedules/sync-scenes', [ScheduleController::class, 'addSceneToSchedule']);
            Route::get('/films/{film}/schedules/{schedule}/pdf', [ScheduleController::class, 'exportPdf']);

            // Day Out of Days
            Route::get('/films/{film}/day-out-of-days', [DayOutOfDaysController::class, 'index']);
            Route::post('/films/{film}/day-out-of-days', [DayOutOfDaysController::class, 'update']);
        });

        // 2. Cast & Crew Module
        Route::middleware('film.module:cast_crew')->group(function () {
            Route::get('/films/{film}/cast-crew', [CastCrewController::class, 'index']);
            Route::post('/films/{film}/cast-crew', [CastCrewController::class, 'store']);
            Route::put('/films/{film}/cast-crew/{id}', [CastCrewController::class, 'update']);
            Route::delete('/films/{film}/cast-crew/{id}', [CastCrewController::class, 'destroy']);
        });

        // 3. Expense Tracking Module
        Route::middleware('film.module:expenses')->group(function () {
            Route::get('/films/{film}/expenses', [ExpenseController::class, 'index']);
            Route::post('/films/{film}/expenses', [ExpenseController::class, 'storeExpense']);
            Route::put('/films/{film}/expenses/{id}', [ExpenseController::class, 'updateExpense']);
            Route::delete('/films/{film}/expenses/{id}', [ExpenseController::class, 'destroyExpense']);
            Route::post('/films/{film}/budgets', [ExpenseController::class, 'storeBudget']);
            Route::delete('/films/{film}/budgets/{id}', [ExpenseController::class, 'destroyBudget']);
            Route::put('/films/{film}/expenses/{id}/status', [ExpenseController::class, 'approveExpense']);
        });

        // 4. Call Sheet Module
        Route::middleware('film.module:call_sheet')->group(function () {
            Route::get('/films/{film}/call-sheets', [CallSheetController::class, 'index']);
            Route::get('/films/{film}/call-sheets/{id}', [CallSheetController::class, 'show']);
            Route::post('/films/{film}/call-sheets', [CallSheetController::class, 'store']);
            Route::put('/films/{film}/call-sheets/{id}', [CallSheetController::class, 'update']);
            Route::delete('/films/{film}/call-sheets/{id}', [CallSheetController::class, 'destroy']);
            Route::post('/films/{film}/call-sheet-entries/{id}/acknowledge', [CallSheetController::class, 'acknowledge']);
            Route::get('/films/{film}/call-sheets/{id}/pdf', [CallSheetController::class, 'exportPdf']);
            Route::post('/films/{film}/call-sheets/{id}/distribute', [CallSheetController::class, 'distribute']);
        });

        // 5. Progress Tracking Module
        Route::middleware('film.module:progress')->group(function () {
            Route::get('/films/{film}/progress', [ProgressController::class, 'index']);
            Route::post('/films/{film}/progress', [ProgressController::class, 'store']);
            Route::put('/films/{film}/progress/{id}', [ProgressController::class, 'update']);
            Route::delete('/films/{film}/progress/{id}', [ProgressController::class, 'destroy']);
        });

        // 6. Locations Module (standalone)
        Route::middleware('film.module:locations')->group(function () {
            Route::get('/films/{film}/locations', [LocationController::class, 'index']);
            Route::post('/films/{film}/locations', [LocationController::class, 'store']);
            Route::get('/films/{film}/locations/{id}', [LocationController::class, 'show']);
            Route::put('/films/{film}/locations/{id}', [LocationController::class, 'update']);
            Route::delete('/films/{film}/locations/{id}', [LocationController::class, 'destroy']);
        });

        // 7. Script & Breakdown Module
        Route::middleware('film.module:script_breakdown')->group(function () {
            Route::get('/films/{film}/script-breakdown', [ScriptBreakdownController::class, 'index']);
            Route::get('/films/{film}/script-breakdown/{id}', [ScriptBreakdownController::class, 'show']);
            Route::post('/films/{film}/script-breakdown', [ScriptBreakdownController::class, 'store']);
            Route::put('/films/{film}/script-breakdown/{id}', [ScriptBreakdownController::class, 'update']);
            Route::delete('/films/{film}/script-breakdown/{id}', [ScriptBreakdownController::class, 'destroy']);
        });

        // 8. Shot List Module
        Route::middleware('film.module:shot_list')->group(function () {
            Route::get('/films/{film}/shot-list', [ShotListController::class, 'index']);
            Route::get('/films/{film}/shot-list/{id}', [ShotListController::class, 'show']);
            Route::post('/films/{film}/shot-list', [ShotListController::class, 'store']);
            Route::put('/films/{film}/shot-list/{id}', [ShotListController::class, 'update']);
            Route::delete('/films/{film}/shot-list/{id}', [ShotListController::class, 'destroy']);
        });

        // 9. Task Management Module
        Route::middleware('film.module:tasks')->group(function () {
            Route::get('/films/{film}/tasks', [TaskController::class, 'index']);
            Route::get('/films/{film}/tasks/{id}', [TaskController::class, 'show']);
            Route::post('/films/{film}/tasks', [TaskController::class, 'store']);
            Route::put('/films/{film}/tasks/{id}', [TaskController::class, 'update']);
            Route::delete('/films/{film}/tasks/{id}', [TaskController::class, 'destroy']);
        });

        // 10. Time Sheets Module
        Route::middleware('film.module:timesheets')->group(function () {
            Route::get('/films/{film}/timesheets', [TimeSheetController::class, 'index']);
            Route::get('/films/{film}/timesheets/{id}', [TimeSheetController::class, 'show']);
            Route::post('/films/{film}/timesheets', [TimeSheetController::class, 'store']);
            Route::put('/films/{film}/timesheets/{id}', [TimeSheetController::class, 'update']);
            Route::delete('/films/{film}/timesheets/{id}', [TimeSheetController::class, 'destroy']);
            Route::put('/films/{film}/timesheets/{id}/approve', [TimeSheetController::class, 'approve']);
            Route::put('/films/{film}/timesheets/{id}/submit', [TimeSheetController::class, 'submit']);
            Route::put('/films/{film}/timesheets/{id}/reject', [TimeSheetController::class, 'reject']);
        });

        // 11. Daily Production Report Module
        Route::middleware('film.module:dpr')->group(function () {
            Route::get('/films/{film}/dpr', [DailyProductionReportController::class, 'index']);
            Route::get('/films/{film}/dpr/{id}', [DailyProductionReportController::class, 'show']);
            Route::post('/films/{film}/dpr', [DailyProductionReportController::class, 'store']);
            Route::put('/films/{film}/dpr/{id}', [DailyProductionReportController::class, 'update']);
            Route::delete('/films/{film}/dpr/{id}', [DailyProductionReportController::class, 'destroy']);
        });

        // 12. Document Library Module
        Route::middleware('film.module:documents')->group(function () {
            Route::get('/films/{film}/documents', [DocumentController::class, 'index']);
            Route::get('/films/{film}/documents/{id}', [DocumentController::class, 'show']);
            Route::post('/films/{film}/documents', [DocumentController::class, 'store']);
            Route::put('/films/{film}/documents/{id}', [DocumentController::class, 'update']);
            Route::delete('/films/{film}/documents/{id}', [DocumentController::class, 'destroy']);
        });

        // 13. In-App Messaging Module
        Route::middleware('film.module:messaging')->group(function () {
            Route::get('/films/{film}/messages', [MessageController::class, 'index']);
            Route::get('/films/{film}/messages/{id}', [MessageController::class, 'show']);
            Route::post('/films/{film}/messages', [MessageController::class, 'store']);
            Route::delete('/films/{film}/messages/{id}', [MessageController::class, 'destroy']);
            Route::post('/films/{film}/messages/{id}/read', [MessageController::class, 'markRead']);
        });

        // 14. Wardrobe Module
        Route::middleware('film.module:wardrobe')->group(function () {
            Route::get('/films/{film}/wardrobe', [WardrobeController::class, 'index']);
            Route::get('/films/{film}/wardrobe/{id}', [WardrobeController::class, 'show']);
            Route::post('/films/{film}/wardrobe', [WardrobeController::class, 'store']);
            Route::put('/films/{film}/wardrobe/{id}', [WardrobeController::class, 'update']);
            Route::delete('/films/{film}/wardrobe/{id}', [WardrobeController::class, 'destroy']);
        });

        // 15. Continuity Module
        Route::middleware('film.module:continuity')->group(function () {
            Route::get('/films/{film}/continuity', [ContinuityController::class, 'index']);
            Route::get('/films/{film}/continuity/{id}', [ContinuityController::class, 'show']);
            Route::post('/films/{film}/continuity', [ContinuityController::class, 'store']);
            Route::put('/films/{film}/continuity/{id}', [ContinuityController::class, 'update']);
            Route::delete('/films/{film}/continuity/{id}', [ContinuityController::class, 'destroy']);
        });

        // 16. Script Writing Module
        Route::middleware('film.module:script')->group(function () {
            Route::get('/films/{film}/scripts', [ScriptController::class, 'index']);
            Route::get('/films/{film}/scripts/{id}', [ScriptController::class, 'show']);
            Route::post('/films/{film}/scripts', [ScriptController::class, 'store']);
            Route::put('/films/{film}/scripts/{id}', [ScriptController::class, 'update']);
            Route::delete('/films/{film}/scripts/{id}', [ScriptController::class, 'destroy']);

            // Scene extraction & splitting
            Route::post('/films/{film}/scripts/{id}/extract-scenes', [SceneController::class, 'autoExtract']);
            Route::get('/films/{film}/scenes', [SceneController::class, 'index']);
            Route::get('/films/{film}/scenes/{id}', [SceneController::class, 'show']);
            Route::post('/films/{film}/scenes', [SceneController::class, 'store']);
            Route::put('/films/{film}/scenes/{id}', [SceneController::class, 'update']);
            Route::delete('/films/{film}/scenes/{id}', [SceneController::class, 'destroy']);
            Route::post('/films/{film}/scenes/{id}/split', [SceneController::class, 'splitScene']);
            Route::post('/films/{film}/scenes/reorder', [SceneController::class, 'reorder']);
        });

        // 17. Vendors Module
        Route::middleware('film.module:vendors')->group(function () {
            Route::apiResource('/films/{film}/vendors', VendorController::class);
        });

        // Analytics (no module check — always available)
        Route::get('/films/{film}/analytics/overview', [AnalyticsController::class, 'overview']);
        Route::get('/films/{film}/analytics/trends', [AnalyticsController::class, 'trends']);
        Route::get('/films/{film}/analytics/forecasts', [AnalyticsController::class, 'forecasts']);

        // Reports (no module check — always available)
        Route::get('/films/{film}/reports/summary', [ReportController::class, 'summary']);

        // Role Management (no module check — always available)
        Route::get('/films/{film}/roles', [RoleController::class, 'index']);
        Route::post('/films/{film}/roles', [RoleController::class, 'store']);
        Route::get('/films/{film}/roles/{roleId}', [RoleController::class, 'show']);
        Route::put('/films/{film}/roles/{roleId}', [RoleController::class, 'update']);
        Route::delete('/films/{film}/roles/{roleId}', [RoleController::class, 'destroy']);
    });

    // Available permissions reference (no film access needed)
    Route::get('/permissions/list', [RoleController::class, 'availablePermissions']);
});
