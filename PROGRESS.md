# Nepal Film OS — Progress & Change Log

**Last updated:** 2026-06-28 19:15 NPT

---

## Module Completion Status (18 total)

| # | Module | Backend | Frontend | CRUD | Seed Data | Notes |
|---|--------|---------|----------|------|-----------|-------|
| 1 | Schedule | ✅ | ✅ | ✅ | ✅ | Stripboard TBD |
| 2 | Script Breakdown | ✅ | ✅ | ✅ | — | Needs script upload UI |
| 3 | Shot List | ✅ | ✅ | ✅ | — | Storyboard upload TBD |
| 4 | Cast & Crew | ✅ | ✅ | ✅ | ✅ | |
| 5 | Budget & Expenses | ✅ | ✅ | ✅ | ✅ | Charts TBD |
| 6 | Progress Tracking | ✅ | ✅ | ✅ | ✅ | Photo upload TBD |
| 7 | Call Sheet | ✅ | ✅ | ✅ | ✅ | WhatsApp share TBD |
| 8 | Locations | ✅ | ✅ | ✅ | ✅ | GPS map TBD |
| 9 | Wardrobe | ✅ | ✅ | ✅ | ✅ | |
| 10 | Continuity | ✅ | ✅ | ✅ | ✅ | Photo comparison TBD |
| 11 | Tasks | ✅ | ✅ | ✅ | ✅ | Board view TBD |
| 12 | Time Sheets | ✅ | ✅ | ✅ | — | QR check-in TBD |
| 13 | DPR | ✅ | ✅ | ✅ | — | Auto-gen job TBD |
| 14 | Documents | ✅ | ✅ | ✅ | — | Watermarking TBD |
| 15 | Messaging | ✅ | ✅ | ✅ | — | WebSocket upgrade TBD |
| 16 | Notifications | ✅ | ✅ | — | — | Email/SMS integration TBD |
| 17 | News Feed | ✅ | ✅ | N/A | ✅ | RSS fetch job active |
| 18 | Series | ✅ | ✅ | ✅ | — | Episode deep link TBD |

**Legend:** ✅ = Done, — = Not yet, TBD = To be developed

---

## Change Log

### 2026-06-28 — Session 1: Full UI Redesign & Bugfixes

**UI Redesign (all 21 views)**
- Rewrote `frontend/src/index.css` — removed glassmorphism/glow/gradients, clean flat design (44.90KB, down from 57.39KB)
- Created `frontend/src/components/ui.jsx` — shared `Modal`, `Input`, `Badge`, `Button`, `Card`, `StatCard`
- Redesigned `Layout.jsx` — simpler sidebar, no groups, no gradient backgrounds
- Redesigned `Dashboard.jsx` — cleaner stat cards
- Updated all 17 remaining views to import shared components, remove inline Modal/Input/Badge definitions, use `btn` CSS classes
- Frontend build: 1886 modules, 451KB JS, 44.90KB CSS, ✓ 5.62s

**Bugfixes**
- **Duplicate route fix**: Removed 3 duplicate location routes from schedule module group in `routes/api.php`. Removed `storeLocation`/`updateLocation`/`destroyLocation` from `ScheduleController`. ScheduleView now uses `locationService` for location CRUD.
- **Input `name` prop fix**: Added `name` destructuring to Input component in `ScheduleView.jsx` so `handleInput` works.
- **Seeder fix**: `DatabaseSeeder.php` now enables all 15 modules (was hardcoded to 5). Film 2 (Prem Geet 4) now has sample data: locations, cast/crew, budgets, expenses, schedule/scene, wardrobe, continuity, tasks, progress. Uses `Film::updateOrCreate` so re-runnable.
- **MessagesView**: Added `deleteMessage()` function and trash button (Trash2 icon) — `messageService.destroy()` existed but wasn't wired up.

**PDF Export**
- Installed `barryvdh/laravel-dompdf`
- `ScheduleController@exportPdf` uses `Pdf::loadView()` + `response($pdf->output(), ...)`
- Created `resources/views/pdfs/schedule.blade.php`
- Added route `GET /films/{film}/schedules/{schedule}/pdf`
- Frontend `scheduleService.exportPdf()` with axios blob download
- PDF download buttons in expanded schedule day

### 2026-06-28 — Session 0: Initial Build

- Backend: 29 models, 20 controllers, 4 middleware, 4 services, 4 jobs, 18 tables migrated
- API routes: 115 routes across all 18 modules + super admin prefix
- Frontend: 18 API service files, 21 view files, App.jsx with all routes
- Modules default-enabled on film creation (`FilmController::store()`)

---

## How to Continue

- Start Vite: `npm run dev` (in `frontend/`)
- Start Laravel: `php artisan serve` (in `backend/`)
- Fix existing films' modules: `php artisan films:repair-modules`
- Re-seed: `php artisan db:seed` (safe to re-run — uses updateOrCreate)

### Priorities for Next Session
1. Chart visualizations for Budget vs Actual
2. Stripboard (drag-drop scene reordering)
3. Script upload UI (PDF upload + text display)
4. Notifications (in-app + email)
5. Photo upload for Wardrobe continuity and Progress updates
