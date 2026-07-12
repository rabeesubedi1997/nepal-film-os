<?php

namespace Database\Seeders;

use App\Models\Film;
use App\Models\FilmRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────────
        $admin = User::updateOrCreate(
            ['email' => 'admin@nepalfilmos.com'],
            ['name' => 'Suresh Sharma (Admin)', 'password' => Hash::make('password'), 'is_active' => true, 'is_super_admin' => true]
        );
        $director = User::updateOrCreate(
            ['email' => 'director@nepalfilmos.com'],
            ['name' => 'Deepak Raj Giri', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $pm = User::updateOrCreate(
            ['email' => 'pm@nepalfilmos.com'],
            ['name' => 'Priya Shrestha', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $test = User::updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test Producer', 'password' => Hash::make('password'), 'is_active' => true]
        );

        // ── Film 1 ─────────────────────────────────────────────────
        $film1 = Film::updateOrCreate(['slug' => 'loot-3-kathmandu-heist'], [
            'title'              => 'Loot 3 — Kathmandu Heist',
            'description'        => 'The legendary heist crew returns for the biggest caper yet — robbing the Kathmandu central bank in broad daylight. A comedy-thriller sequel packed with drama, action, and Nepali wit.',
            'genre'              => 'Action Comedy',
            'language'           => 'Nepali',
            'production_company' => 'Cinepati Films',
            'status'             => 'Production',
            'start_date'         => '2026-06-01',
            'expected_wrap_date' => '2026-09-30',
            'is_active'          => true,
            'created_by'         => $admin->id,
        ]);
        $film1Id = $film1->id;

        // ── Film 2 ─────────────────────────────────────────────────
        $film2 = Film::updateOrCreate(['slug' => 'prem-geet-4'], [
            'title'              => 'Prem Geet 4 — Himal ko Prem',
            'description'        => 'A romantic musical set against the stunning backdrop of the Himalayas. Two hearts, thousands of miles apart, connected by destiny and melody.',
            'genre'              => 'Romance / Musical',
            'language'           => 'Nepali',
            'production_company' => 'Akar Films',
            'status'             => 'Pre-Production',
            'start_date'         => '2026-08-15',
            'expected_wrap_date' => '2026-12-01',
            'is_active'          => true,
            'created_by'         => $test->id,
        ]);
        $film2Id = $film2->id;

        // ── Film Roles ─────────────────────────────────────────────
        $f1AdminRole = FilmRole::firstOrCreate(
            ['film_id' => $film1Id, 'slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'Full access', 'is_admin' => true, 'permissions' => [], 'created_by' => $admin->id]
        );
        $f1DirectorRole = FilmRole::firstOrCreate(
            ['film_id' => $film1Id, 'slug' => 'director'],
            ['name' => 'Director', 'description' => 'Creative lead', 'is_admin' => false, 'permissions' => ['schedule.view', 'schedule.create', 'schedule.edit', 'scene.view', 'scene.create', 'scene.edit', 'script.view', 'script.create', 'script.edit', 'script_breakdown.view', 'script_breakdown.create', 'script_breakdown.edit', 'shot_list.view', 'shot_list.create', 'shot_list.edit', 'cast_crew.view', 'expense.create', 'progress.view', 'progress.create', 'progress.edit', 'location.view', 'task.view', 'task.create', 'task.edit'], 'created_by' => $admin->id]
        );
        $f1PmRole = FilmRole::firstOrCreate(
            ['film_id' => $film1Id, 'slug' => 'production-manager'],
            ['name' => 'Production Manager', 'description' => 'Operations lead', 'is_admin' => false, 'permissions' => ['film.invite_users', 'schedule.view', 'schedule.create', 'schedule.edit', 'scene.view', 'scene.create', 'scene.edit', 'script_breakdown.view', 'script_breakdown.create', 'cast_crew.view', 'cast_crew.create', 'cast_crew.edit', 'budget.view', 'budget.manage', 'expense.create', 'expense.edit', 'expense.approve', 'call_sheet.view', 'call_sheet.create', 'call_sheet.edit', 'progress.view', 'progress.create', 'progress.edit', 'location.view', 'location.create', 'location.edit', 'task.view', 'task.create', 'task.edit', 'task.delete', 'timesheet.view', 'timesheet.approve', 'dpr.view', 'dpr.create', 'document.view', 'document.create', 'message.view', 'message.create', 'notification.view', 'notification.mark_read'], 'created_by' => $admin->id]
        );

        $f2AdminRole = FilmRole::firstOrCreate(
            ['film_id' => $film2Id, 'slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'Full access', 'is_admin' => true, 'permissions' => [], 'created_by' => $test->id]
        );

        // ── Film Users (roles per film) ────────────────────────────
        DB::table('film_users')->insertOrIgnore([
            ['film_id' => $film1Id, 'user_id' => $admin->id,    'role' => 'Admin',              'role_id' => $f1AdminRole->id,    'department' => 'Production', 'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['film_id' => $film1Id, 'user_id' => $director->id, 'role' => 'Director',           'role_id' => $f1DirectorRole->id, 'department' => 'Direction',  'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['film_id' => $film1Id, 'user_id' => $pm->id,       'role' => 'Production Manager', 'role_id' => $f1PmRole->id,       'department' => 'Production', 'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['film_id' => $film1Id, 'user_id' => $test->id,     'role' => 'Admin',              'role_id' => $f1AdminRole->id,    'department' => 'Production', 'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['film_id' => $film2Id, 'user_id' => $test->id,     'role' => 'Admin',              'role_id' => $f2AdminRole->id,    'department' => 'Production', 'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            ['film_id' => $film2Id, 'user_id' => $admin->id,    'role' => 'Admin',              'role_id' => $f2AdminRole->id,    'department' => 'Production', 'is_active' => 1, 'joined_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Modules ────────────────────────────────────────────────
        $modules = [
            'schedule', 'cast_crew', 'expenses', 'call_sheet', 'progress', 'locations',
            'script', 'script_breakdown', 'shot_list', 'tasks', 'timesheets', 'dpr', 'documents',
            'messaging', 'wardrobe', 'continuity', 'storyboard', 'production_calendar',
            'day_out_of_days', 'reports', 'analytics',
        ];
        foreach ([$film1Id, $film2Id] as $fid) {
            foreach ($modules as $mod) {
                DB::table('film_modules')->insertOrIgnore([
                    'film_id'    => $fid,
                    'module_name'=> $mod,
                    'is_enabled' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // ── Locations ──────────────────────────────────────────────
        $loc1 = DB::table('locations')->insertGetId([
            'film_id'        => $film1Id,
            'name'           => 'Asan Tole, Kathmandu',
            'address'        => 'Asan, Kathmandu 44600',
            'gps_lat'        => 27.7064,
            'gps_lng'        => 85.3131,
            'permit_status'  => 'Approved',
            'contact_name'   => 'Ram Bahadur KC',
            'contact_phone'  => '9841000001',
            'parking_info'   => 'Ratnapark underground parking, 200m away',
            'facilities_notes'=> 'Outdoor market. Noisy mornings. Best shot 5–8am.',
            'created_at'     => now(), 'updated_at' => now(),
        ]);
        $loc2 = DB::table('locations')->insertGetId([
            'film_id'        => $film1Id,
            'name'           => 'Patan Durbar Square',
            'address'        => 'Patan, Lalitpur 44700',
            'gps_lat'        => 27.6724,
            'gps_lng'        => 85.3239,
            'permit_status'  => 'Approved',
            'contact_name'   => 'Sita Maharjan',
            'contact_phone'  => '9841000002',
            'parking_info'   => 'Patan Hospital parking, 500m away',
            'facilities_notes'=> 'UNESCO site. Strict no-smoke, no-alcohol rule. Security fee NPR 25,000.',
            'created_at'     => now(), 'updated_at' => now(),
        ]);
        $loc3 = DB::table('locations')->insertGetId([
            'film_id'        => $film1Id,
            'name'           => 'Nepal Bank Main Branch',
            'address'        => 'Dharmapath, Kathmandu',
            'gps_lat'        => 27.7044,
            'gps_lng'        => 85.3154,
            'permit_status'  => 'Pending',
            'contact_name'   => 'Bijay Thapa (PR)',
            'contact_phone'  => '9841000003',
            'parking_info'   => 'Street parking only. Production van bay allocated.',
            'facilities_notes'=> 'Interior shoot only. Power supply confirmed. AC available.',
            'created_at'     => now(), 'updated_at' => now(),
        ]);

        // ── Schedules (shoot days) ─────────────────────────────────
        $sched1 = DB::table('schedules')->insertGetId([
            'film_id'     => $film1Id, 'day_number' => 1,
            'shoot_date'  => '2026-07-01', 'status' => 'Completed',
            'call_time'   => '05:30:00',   'wrap_time' => '18:00:00',
            'location_id' => $loc1, 'notes' => 'Market chase sequence. 3 cameras.',
            'created_at'  => now(), 'updated_at' => now(),
        ]);
        $sched2 = DB::table('schedules')->insertGetId([
            'film_id'     => $film1Id, 'day_number' => 2,
            'shoot_date'  => '2026-07-03', 'status' => 'Completed',
            'call_time'   => '06:00:00',   'wrap_time' => '19:30:00',
            'location_id' => $loc2, 'notes' => 'Heritage exterior shots + dialogue scenes.',
            'created_at'  => now(), 'updated_at' => now(),
        ]);
        $sched3 = DB::table('schedules')->insertGetId([
            'film_id'     => $film1Id, 'day_number' => 3,
            'shoot_date'  => '2026-07-05', 'status' => 'In Progress',
            'call_time'   => '05:00:00',   'wrap_time' => null,
            'location_id' => $loc3, 'notes' => 'Bank heist interior. Full crew. 2nd unit standby.',
            'created_at'  => now(), 'updated_at' => now(),
        ]);
        $sched4 = DB::table('schedules')->insertGetId([
            'film_id'     => $film1Id, 'day_number' => 4,
            'shoot_date'  => '2026-07-08', 'status' => 'Scheduled',
            'call_time'   => '06:00:00',   'wrap_time' => null,
            'location_id' => $loc1, 'notes' => 'Comedy subplot. 1 camera. Small unit.',
            'created_at'  => now(), 'updated_at' => now(),
        ]);
        $sched5 = DB::table('schedules')->insertGetId([
            'film_id'     => $film1Id, 'day_number' => 5,
            'shoot_date'  => '2026-07-10', 'status' => 'Scheduled',
            'call_time'   => '05:30:00',   'wrap_time' => null,
            'location_id' => $loc2, 'notes' => 'Climax confrontation scene.',
            'created_at'  => now(), 'updated_at' => now(),
        ]);

        // ── Scenes ─────────────────────────────────────────────────
        $scene1 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'1','scene_heading'=>'EXT. ASAN MARKET — DAWN','int_ext'=>'EXT','location_id'=>$loc1,'day_or_night'=>'DAY','page_count'=>3.5,'summary'=>'The crew surveys the target. Comic banter as they pretend to be vegetable vendors.','status'=>'Completed','order_index'=>1,'created_at'=>now(),'updated_at'=>now()]);
        $scene2 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'2','scene_heading'=>'INT. CREW VAN — CONTINUOUS','int_ext'=>'INT','location_id'=>$loc1,'day_or_night'=>'DAY','page_count'=>2.0,'summary'=>'Mission briefing. The leader unveils the heist plan on a chalkboard to comedic chaos.','status'=>'Completed','order_index'=>2,'created_at'=>now(),'updated_at'=>now()]);
        $scene3 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'3','scene_heading'=>'EXT. PATAN DURBAR — MORNING','int_ext'=>'EXT','location_id'=>$loc2,'day_or_night'=>'DAY','page_count'=>4.0,'summary'=>'The distraction team creates a folk dance flashmob to divert security guards.','status'=>'Completed','order_index'=>3,'created_at'=>now(),'updated_at'=>now()]);
        $scene4 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'4','scene_heading'=>'INT. NEPAL BANK — VAULT ROOM','int_ext'=>'INT','location_id'=>$loc3,'day_or_night'=>'DAY','page_count'=>5.5,'summary'=>'The main heist. Everything goes wrong. Improvised chaos ensues with hilarious results.','status'=>'In Progress','order_index'=>4,'created_at'=>now(),'updated_at'=>now()]);
        $scene5 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'5','scene_heading'=>'INT. BANK LOBBY — CONTINUOUS','int_ext'=>'INT','location_id'=>$loc3,'day_or_night'=>'DAY','page_count'=>3.0,'summary'=>'Confrontation with the bank manager who turns out to be the crew leader\'s uncle.','status'=>'Not Started','order_index'=>5,'created_at'=>now(),'updated_at'=>now()]);
        $scene6 = DB::table('scenes')->insertGetId(['film_id'=>$film1Id,'scene_number'=>'6','scene_heading'=>'EXT. PATAN — EVENING CHASE','int_ext'=>'EXT','location_id'=>$loc2,'day_or_night'=>'DAY','page_count'=>6.0,'summary'=>'Wild chase through the UNESCO heritage site. Police on motorbikes, crew on rickshaws.','status'=>'Not Started','order_index'=>6,'created_at'=>now(),'updated_at'=>now()]);

        // Link scenes to schedules
        DB::table('scene_schedule')->insert([
            ['schedule_id'=>$sched1,'scene_id'=>$scene1,'order_index'=>1,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched1,'scene_id'=>$scene2,'order_index'=>2,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched2,'scene_id'=>$scene3,'order_index'=>1,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched3,'scene_id'=>$scene4,'order_index'=>1,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched3,'scene_id'=>$scene5,'order_index'=>2,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched4,'scene_id'=>$scene5,'order_index'=>1,'created_at'=>now(),'updated_at'=>now()],
            ['schedule_id'=>$sched5,'scene_id'=>$scene6,'order_index'=>1,'created_at'=>now(),'updated_at'=>now()],
        ]);

        // ── Cast & Crew ────────────────────────────────────────────
        $castData = [
            ['name'=>'Saugat Malla',      'role_type'=>'Cast',  'role_name'=>'Lead Actor',     'department'=>'Cast',         'character_name'=>'Bhola Dai',        'contact_phone'=>'9841100001','contact_email'=>'saugat@example.com','contract_status'=>'Signed',  'day_rates'=>25000],
            ['name'=>'Dayahang Rai',       'role_type'=>'Cast',  'role_name'=>'Lead Actor',     'department'=>'Cast',         'character_name'=>'Raju',              'contact_phone'=>'9841100002','contact_email'=>'dayahang@example.com','contract_status'=>'Signed', 'day_rates'=>22000],
            ['name'=>'Priya Thakur',       'role_type'=>'Cast',  'role_name'=>'Lead Actress',   'department'=>'Cast',         'character_name'=>'Pooja',             'contact_phone'=>'9841100003','contact_email'=>'priya@example.com','contract_status'=>'Signed',   'day_rates'=>20000],
            ['name'=>'Buddhi Tamang',      'role_type'=>'Cast',  'role_name'=>'Supporting',     'department'=>'Cast',         'character_name'=>'Inspector Sharma',  'contact_phone'=>'9841100004','contact_email'=>'buddhi@example.com','contract_status'=>'Signed',  'day_rates'=>8000],
            ['name'=>'Hari KC',            'role_type'=>'Cast',  'role_name'=>'Comic Relief',   'department'=>'Cast',         'character_name'=>'Kancha',            'contact_phone'=>'9841100005','contact_email'=>'hari@example.com','contract_status'=>'Signed',    'day_rates'=>6000],
            ['name'=>'Ramesh Upreti',      'role_type'=>'Crew',  'role_name'=>'DOP',            'department'=>'Camera',       'character_name'=>null,               'contact_phone'=>'9841200001','contact_email'=>'ramesh@example.com','contract_status'=>'Signed',   'day_rates'=>15000],
            ['name'=>'Sita Gurung',        'role_type'=>'Crew',  'role_name'=>'1st AD',         'department'=>'Direction',    'character_name'=>null,               'contact_phone'=>'9841200002','contact_email'=>'sita@example.com','contract_status'=>'Signed',     'day_rates'=>10000],
            ['name'=>'Bikram Lama',        'role_type'=>'Crew',  'role_name'=>'Gaffer',         'department'=>'Lighting',     'character_name'=>null,               'contact_phone'=>'9841200003','contact_email'=>'bikram@example.com','contract_status'=>'Signed',   'day_rates'=>8000],
            ['name'=>'Anita Basnet',       'role_type'=>'Crew',  'role_name'=>'Costume Designer','department'=>'Wardrobe',    'character_name'=>null,               'contact_phone'=>'9841200004','contact_email'=>'anita@example.com','contract_status'=>'Signed',    'day_rates'=>9000],
            ['name'=>'Sunil Maharjan',     'role_type'=>'Crew',  'role_name'=>'Art Director',   'department'=>'Art',          'character_name'=>null,               'contact_phone'=>'9841200005','contact_email'=>'sunil@example.com','contract_status'=>'Signed',    'day_rates'=>12000],
            ['name'=>'Rita Oli',           'role_type'=>'Crew',  'role_name'=>'Makeup Artist',  'department'=>'Makeup',       'character_name'=>null,               'contact_phone'=>'9841200006','contact_email'=>'rita@example.com','contract_status'=>'Signed',    'day_rates'=>7000],
            ['name'=>'Prakash Adhikari',   'role_type'=>'Crew',  'role_name'=>'Sound Recordist','department'=>'Sound',        'character_name'=>null,               'contact_phone'=>'9841200007','contact_email'=>'prakash@example.com','contract_status'=>'Pending', 'day_rates'=>8500],
            ['name'=>'Manisha Pokhrel',    'role_type'=>'Crew',  'role_name'=>'Script Supervisor','department'=>'Production', 'character_name'=>null,               'contact_phone'=>'9841200008','contact_email'=>'manisha@example.com','contract_status'=>'Signed',  'day_rates'=>7500],
            ['name'=>'Deependra Shrestha', 'role_type'=>'Crew',  'role_name'=>'Camera Operator','department'=>'Camera',       'character_name'=>null,               'contact_phone'=>'9841200009','contact_email'=>'deependra@example.com','contract_status'=>'Signed','day_rates'=>9000],
            ['name'=>'Kamala Rai',         'role_type'=>'Crew',  'role_name'=>'Production Driver','department'=>'Transport',  'character_name'=>null,               'contact_phone'=>'9841200010','contact_email'=>'kamala@example.com','contract_status'=>'Signed',   'day_rates'=>4000],
        ];
        $castIds = [];
        foreach ($castData as $c) {
            $castIds[] = DB::table('cast_crew')->insertGetId(array_merge($c, ['film_id'=>$film1Id,'created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Budgets ─────────────────────────────────────────────────
        $budgetData = [
            ['department_id'=>'Camera',     'category'=>'Camera Equipment',  'budgeted_amount'=>500000],
            ['department_id'=>'Lighting',   'category'=>'Lighting & Grip',   'budgeted_amount'=>300000],
            ['department_id'=>'Art',        'category'=>'Set Dressing',      'budgeted_amount'=>400000],
            ['department_id'=>'Wardrobe',   'category'=>'Costumes',          'budgeted_amount'=>200000],
            ['department_id'=>'Cast',       'category'=>'Cast Payments',     'budgeted_amount'=>1500000],
            ['department_id'=>'Crew',       'category'=>'Crew Salaries',     'budgeted_amount'=>800000],
            ['department_id'=>'Location',   'category'=>'Location Fees',     'budgeted_amount'=>250000],
            ['department_id'=>'Transport',  'category'=>'Travel & Logistics','budgeted_amount'=>150000],
            ['department_id'=>'Catering',   'category'=>'Food & Catering',   'budgeted_amount'=>120000],
            ['department_id'=>'Post',       'category'=>'Post Production',   'budgeted_amount'=>600000],
            ['department_id'=>'Marketing',  'category'=>'Promotion',         'budgeted_amount'=>350000],
            ['department_id'=>'Misc',       'category'=>'Miscellaneous',     'budgeted_amount'=>100000],
        ];
        foreach ($budgetData as $b) {
            DB::table('budgets')->insert(array_merge($b, ['film_id'=>$film1Id,'currency'=>'NPR','created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Expenses ────────────────────────────────────────────────
        $expenseData = [
            ['department_id'=>'Camera',  'category'=>'Camera Equipment', 'amount'=>120000,'description'=>'RED Komodo rental — 5 days','date'=>'2026-06-15','status'=>'Paid',     'payment_method'=>'Bank Transfer'],
            ['department_id'=>'Camera',  'category'=>'Camera Equipment', 'amount'=>45000, 'description'=>'Lens set rental (Zeiss CP3)','date'=>'2026-06-20','status'=>'Paid',    'payment_method'=>'Cheque'],
            ['department_id'=>'Lighting','category'=>'Lighting & Grip',  'amount'=>85000, 'description'=>'HMI lights and generators','date'=>'2026-06-18','status'=>'Approved',  'payment_method'=>'Bank Transfer'],
            ['department_id'=>'Lighting','category'=>'Lighting & Grip',  'amount'=>12000, 'description'=>'Sandbags and C-stands','date'=>'2026-06-22','status'=>'Paid',          'payment_method'=>'Cash'],
            ['department_id'=>'Art',     'category'=>'Set Dressing',     'amount'=>95000, 'description'=>'Bank vault set construction','date'=>'2026-06-25','status'=>'Approved','payment_method'=>'Bank Transfer'],
            ['department_id'=>'Art',     'category'=>'Set Dressing',     'amount'=>34000, 'description'=>'Prop vehicles (3 units)','date'=>'2026-06-28','status'=>'Pending',     'payment_method'=>null],
            ['department_id'=>'Wardrobe','category'=>'Costumes',         'amount'=>48000, 'description'=>'Lead cast wardrobes + accessories','date'=>'2026-06-20','status'=>'Paid','payment_method'=>'Cash'],
            ['department_id'=>'Cast',    'category'=>'Cast Payments',    'amount'=>250000,'description'=>'Advance payment — lead cast','date'=>'2026-05-30','status'=>'Paid',    'payment_method'=>'Bank Transfer'],
            ['department_id'=>'Cast',    'category'=>'Cast Payments',    'amount'=>180000,'description'=>'Supporting cast weekly payment','date'=>'2026-07-01','status'=>'Paid', 'payment_method'=>'Bank Transfer'],
            ['department_id'=>'Location','category'=>'Location Fees',    'amount'=>75000, 'description'=>'Patan Durbar Square permit','date'=>'2026-06-10','status'=>'Paid',    'payment_method'=>'Cheque'],
            ['department_id'=>'Location','category'=>'Location Fees',    'amount'=>30000, 'description'=>'Asan market permission + security','date'=>'2026-06-12','status'=>'Paid','payment_method'=>'Cash'],
            ['department_id'=>'Transport','category'=>'Travel & Logistics','amount'=>45000,'description'=>'Production van rental (2 vehicles)','date'=>'2026-07-01','status'=>'Approved','payment_method'=>'Bank Transfer'],
            ['department_id'=>'Catering','category'=>'Food & Catering',  'amount'=>18000, 'description'=>'Day 1 crew catering — 45 people','date'=>'2026-07-01','status'=>'Paid','payment_method'=>'Cash'],
            ['department_id'=>'Catering','category'=>'Food & Catering',  'amount'=>19500, 'description'=>'Day 2 crew catering — 48 people','date'=>'2026-07-03','status'=>'Paid','payment_method'=>'Cash'],
            ['department_id'=>'Misc',    'category'=>'Miscellaneous',    'amount'=>8500,  'description'=>'Stationery and office supplies','date'=>'2026-06-05','status'=>'Paid', 'payment_method'=>'Cash'],
            ['department_id'=>'Crew',    'category'=>'Crew Salaries',    'amount'=>195000,'description'=>'Week 1 crew payments','date'=>'2026-07-04','status'=>'Approved',       'payment_method'=>'Bank Transfer'],
        ];
        foreach ($expenseData as $e) {
            DB::table('expenses')->insert(array_merge($e, ['film_id'=>$film1Id,'currency'=>'NPR','submitted_by'=>$pm->id,'created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Call Sheets ─────────────────────────────────────────────
        $cs1 = DB::table('call_sheets')->insertGetId([
            'film_id'=>$film1Id,'schedule_id'=>$sched1,'shoot_date'=>'2026-07-01',
            'general_call_time'=>'05:30:00','location_id'=>$loc1,
            'catering_info'=>'Dal Bhat served at 12:00 noon. Snacks at 10:00am. Mineral water on set throughout.',
            'weather'=>'Sunny, 28°C. Light breeze. UV index high — arrange shade for cast.',
            'emergency_info'=>'Nearest hospital: Bir Hospital (1.2km). Emergency: 9841911111. Fire: 101.',
            'special_instructions'=>'Market vendors briefed. No motorized vehicles on set between 6-10am. Crowd control via ropes.',
            'is_sent'=>1,'sent_at'=>now(),'created_by'=>$pm->id,'created_at'=>now(),'updated_at'=>now(),
        ]);
        $cs2 = DB::table('call_sheets')->insertGetId([
            'film_id'=>$film1Id,'schedule_id'=>$sched3,'shoot_date'=>'2026-07-05',
            'general_call_time'=>'05:00:00','location_id'=>$loc3,
            'catering_info'=>'Breakfast at 6am (selection of roti, egg). Lunch 12:30pm. Evening snacks 4pm.',
            'weather'=>'Indoor shoot. AC maintained at 22°C.',
            'emergency_info'=>'In-building medical kit available. Nearest hospital: Grande International (2km).',
            'special_instructions'=>'Bank staff NOT to be approached during filming. Security briefed. Silence on set at all times.',
            'is_sent'=>1,'sent_at'=>now(),'created_by'=>$pm->id,'created_at'=>now(),'updated_at'=>now(),
        ]);

        // Call sheet entries
        foreach (array_slice($castIds, 0, 6) as $idx => $castId) {
            DB::table('call_sheet_entries')->insert([
                'call_sheet_id'=>$cs1,'cast_crew_id'=>$castId,
                'call_time'=> $idx < 3 ? '05:30:00' : '06:30:00',
                'scenes_today'=>json_encode(['Scene 1','Scene 2']),
                'notes'=>$idx === 0 ? 'Prosthetic makeup — report to makeup by 5:00am' : null,
                'is_acknowledged'=>$idx < 4 ? 1 : 0,
                'acknowledged_at'=>$idx < 4 ? now() : null,
                'created_at'=>now(),'updated_at'=>now(),
            ]);
        }

        // ── Progress Updates (Film 1) ──────────────────────────────
        DB::table('progress_updates')->insert([
            ['film_id'=>$film1Id,'scene_id'=>$scene1,'schedule_id'=>$sched1,'status'=>'Completed','notes'=>'Scene 1 done in 4 takes. Great energy from the market. DOP happy with the light.','reported_by'=>$director->id,'scenes_completed'=>true,'pages_completed'=>3.5,'created_at'=>'2026-07-01 10:45:00','updated_at'=>now()],
            ['film_id'=>$film1Id,'scene_id'=>$scene2,'schedule_id'=>$sched1,'status'=>'Completed','notes'=>'Scene 2 completed. Some improv from Saugat that worked brilliantly. Will keep.','reported_by'=>$director->id,'scenes_completed'=>true,'pages_completed'=>2.0,'created_at'=>'2026-07-01 15:20:00','updated_at'=>now()],
            ['film_id'=>$film1Id,'scene_id'=>$scene3,'schedule_id'=>$sched2,'status'=>'Completed','notes'=>'Patan heritage exterior shots done. The flashmob sequence took 6 takes. Crowd control excellent.','reported_by'=>$director->id,'scenes_completed'=>true,'pages_completed'=>4.0,'created_at'=>'2026-07-03 17:00:00','updated_at'=>now()],
            ['film_id'=>$film1Id,'scene_id'=>$scene4,'schedule_id'=>$sched3,'status'=>'In Progress','notes'=>'Bank interior underway. Vault room rigged. Shooting vault break-in sequence now.','reported_by'=>$director->id,'scenes_completed'=>false,'pages_completed'=>2.5,'created_at'=>'2026-07-05 11:00:00','updated_at'=>now()],
        ]);

        // ═══════════════════════════════════════════════════════════════
        //  FILM 2 — Prem Geet 4: Himal ko Prem (Romance / Musical)
        // ═══════════════════════════════════════════════════════════════

        // ── Locations ──────────────────────────────────────────────
        $f2loc1 = DB::table('locations')->insertGetId([
            'film_id'=>$film2Id,'name'=>'Phewa Lake, Pokhara','address'=>'Phewa Lake, Pokhara 33700',
            'gps_lat'=>28.2096,'gps_lng'=>83.9552,'permit_status'=>'Approved',
            'contact_name'=>'Gopal Bhattarai','contact_phone'=>'9851000001',
            'parking_info'=>'Lakeside parking (100m)','facilities_notes'=>'Scenic lake view. Boats available. Best light at sunrise.',
            'created_at'=>now(),'updated_at'=>now(),
        ]);
        $f2loc2 = DB::table('locations')->insertGetId([
            'film_id'=>$film2Id,'name'=>'Sarangkot Viewpoint','address'=>'Sarangkot, Pokhara',
            'gps_lat'=>28.2129,'gps_lng'=>83.9476,'permit_status'=>'Approved',
            'contact_name'=>'Maya Gurung','contact_phone'=>'9851000002',
            'parking_info'=>'Hilltop parking (50m)','facilities_notes'=>'Himalayan backdrop. Windy conditions expected.',
            'created_at'=>now(),'updated_at'=>now(),
        ]);

        // ── Cast & Crew ────────────────────────────────────────────
        $f2castIds = [];
        foreach ([
            ['name'=>'Anmol KC','role_type'=>'Cast','role_name'=>'Lead Actor','department'=>'Cast','character_name'=>'Aarav','contact_phone'=>'9852000001','contract_status'=>'Signed','day_rates'=>30000],
            ['name'=>'Samragyee Shah','role_type'=>'Cast','role_name'=>'Lead Actress','department'=>'Cast','character_name'=>'Maya','contact_phone'=>'9852000002','contract_status'=>'Signed','day_rates'=>28000],
            ['name'=>'Sushant Karki','role_type'=>'Crew','role_name'=>'DOP','department'=>'Camera','character_name'=>null,'contact_phone'=>'9853000001','contract_status'=>'Signed','day_rates'=>18000],
            ['name'=>'Nisha Adhikari','role_type'=>'Crew','role_name'=>'Music Director','department'=>'Sound','character_name'=>null,'contact_phone'=>'9853000002','contract_status'=>'Signed','day_rates'=>25000],
        ] as $c) {
            $f2castIds[] = DB::table('cast_crew')->insertGetId(array_merge($c, ['film_id'=>$film2Id,'created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Budgets ─────────────────────────────────────────────────
        foreach ([
            ['department_id'=>'Cast','category'=>'Cast Payments','budgeted_amount'=>2000000],
            ['department_id'=>'Camera','category'=>'Camera & Lens','budgeted_amount'=>600000],
            ['department_id'=>'Sound','category'=>'Music & Audio','budgeted_amount'=>500000],
            ['department_id'=>'Location','category'=>'Location Fees','budgeted_amount'=>150000],
            ['department_id'=>'Catering','category'=>'Food & Catering','budgeted_amount'=>80000],
        ] as $b) {
            DB::table('budgets')->insert(array_merge($b, ['film_id'=>$film2Id,'currency'=>'NPR','created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Expenses ────────────────────────────────────────────────
        foreach ([
            ['department_id'=>'Cast','category'=>'Cast Payments','amount'=>500000,'description'=>'Lead cast advance payment','date'=>'2026-08-01','status'=>'Paid','payment_method'=>'Bank Transfer'],
            ['department_id'=>'Camera','category'=>'Camera & Lens','amount'=>150000,'description'=>'Sony FX6 rental (month 1)','date'=>'2026-08-10','status'=>'Paid','payment_method'=>'Bank Transfer'],
            ['department_id'=>'Sound','category'=>'Music & Audio','amount'=>80000,'description'=>'Studio recording session — title song','date'=>'2026-08-15','status'=>'Approved','payment_method'=>'Cheque'],
            ['department_id'=>'Location','category'=>'Location Fees','amount'=>45000,'description'=>'Phewa Lake film permit','date'=>'2026-08-05','status'=>'Paid','payment_method'=>'Cash'],
            ['department_id'=>'Catering','category'=>'Food & Catering','amount'=>12000,'description'=>'Recce team catering (3 days)','date'=>'2026-08-12','status'=>'Paid','payment_method'=>'Cash'],
        ] as $e) {
            DB::table('expenses')->insert(array_merge($e, ['film_id'=>$film2Id,'currency'=>'NPR','submitted_by'=>$pm->id,'created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Schedules & Scenes ──────────────────────────────────────
        $f2sched = DB::table('schedules')->insertGetId([
            'film_id'=>$film2Id,'day_number'=>1,'shoot_date'=>'2026-09-01','status'=>'Scheduled',
            'call_time'=>'05:00:00','wrap_time'=>null,'location_id'=>$f2loc1,
            'notes'=>'Phewa Lake boat song sequence. Full crew.',
            'created_at'=>now(),'updated_at'=>now(),
        ]);
        $f2scene = DB::table('scenes')->insertGetId([
            'film_id'=>$film2Id,'scene_number'=>'1','scene_heading'=>'EXT. PHEWA LAKE — SUNRISE','int_ext'=>'EXT','location_id'=>$f2loc1,
            'day_or_night'=>'DAY','page_count'=>4.5,'summary'=>'Romantic boat song with full orchestra. Aarav and Maya sing their duet under the morning sun.',
            'status'=>'Not Started','order_index'=>1,'created_at'=>now(),'updated_at'=>now(),
        ]);
        DB::table('scene_schedule')->insert([
            'schedule_id'=>$f2sched,'scene_id'=>$f2scene,'order_index'=>1,'created_at'=>now(),'updated_at'=>now(),
        ]);

        // ── Wardrobe ────────────────────────────────────────────────
        foreach ([
            ['film_id'=>$film2Id,'character_name'=>'Maya','scene_id'=>null,'description'=>'Red Silk Sari for Phewa Lake song','status'=>'Ready','notes'=>'For Phewa Lake song sequence. Hand-stitched.'],
            ['film_id'=>$film2Id,'character_name'=>'Aarav','scene_id'=>null,'description'=>'Nepali Topi & Daura Suruwal','status'=>'Ready','notes'=>'Traditional attire for village scenes.'],
            ['film_id'=>$film2Id,'character_name'=>'Maya','scene_id'=>null,'description'=>'Pashmina Shawl for mountain scenes','status'=>'In Alteration','notes'=>'For mountain scenes only.'],
        ] as $w) {
            DB::table('wardrobe_items')->insert(array_merge($w, ['created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Continuity ──────────────────────────────────────────────
        foreach ([
            ['film_id'=>$film2Id,'scene_id'=>$f2scene,'type'=>'makeup','notes'=>'Maya: hair braided with red ribbon for song, loose for drama. No nail polish visible on screen.','captured_by'=>$pm->id],
            ['film_id'=>$film2Id,'scene_id'=>$f2scene,'type'=>'props','notes'=>'Blue diary always on Aarav\'s left breast pocket. Prop master briefed.','captured_by'=>$pm->id],
        ] as $c) {
            DB::table('continuity_records')->insert(array_merge($c, ['created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Tasks ───────────────────────────────────────────────────
        foreach ([
            ['film_id'=>$film2Id,'title'=>'Book Sarangkot permit','description'=>'Coordinate with Pokhara tourism board for hilltop shoot','assigned_to'=>$director->id,'priority'=>'High','status'=>'in_progress','due_date'=>'2026-08-25','created_by'=>$pm->id],
            ['film_id'=>$film2Id,'title'=>'Finalize choreography','description'=>'Boat song choreography rehearsal with dancers','assigned_to'=>$pm->id,'priority'=>'Medium','status'=>'todo','due_date'=>'2026-08-28','created_by'=>$pm->id],
            ['film_id'=>$film2Id,'title'=>'Arrange boat rental','description'=>'3 traditional boats + 2 safety boats for lake sequence','assigned_to'=>null,'priority'=>'Medium','status'=>'todo','due_date'=>'2026-08-30','created_by'=>$pm->id],
        ] as $t) {
            DB::table('tasks')->insert(array_merge($t, ['created_at'=>now(),'updated_at'=>now()]));
        }

        // ── Progress Update (Film 2) ─────────────────────────────────
        DB::table('progress_updates')->insert([
            ['film_id'=>$film2Id,'scene_id'=>$f2scene,'schedule_id'=>$f2sched,'status'=>'Pre-Production','notes'=>'Pre-production phase. Location scouting complete. Budget approved. Cast finalized.','reported_by'=>$pm->id,'scenes_completed'=>false,'pages_completed'=>0,'created_at'=>'2026-08-20 09:00:00','updated_at'=>now()],
        ]);
    }
}
