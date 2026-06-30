<?php

namespace Database\Seeders;

use App\Models\Film;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin  = User::where('email', 'admin@nepalfilmos.com')->first();
        $dir    = User::where('email', 'director@nepalfilmos.com')->first();
        $pm     = User::where('email', 'pm@nepalfilmos.com')->first();
        $test   = User::where('email', 'test@example.com')->first();

        $film1  = Film::where('slug', 'loot-3-kathmandu-heist')->first();
        $film2  = Film::where('slug', 'prem-geet-4')->first();

        $f1 = $film1->id;
        $f2 = $film2->id;

        $now = now();

        // ══════════════════════════════════════════════════════════════
        // SUBSCRIPTION PLANS
        // ══════════════════════════════════════════════════════════════
        $plans = [
            ['name' => 'Starter', 'price_npr' => 0, 'price_usd' => 0, 'billing_cycle' => 'free', 'max_films' => 1, 'max_users_per_film' => 5, 'features' => json_encode(['Basic modules', 'Up to 5 users', '1 film']), 'is_active' => true],
            ['name' => 'Professional', 'price_npr' => 9999, 'price_usd' => 79, 'billing_cycle' => 'monthly', 'max_films' => 5, 'max_users_per_film' => 25, 'features' => json_encode(['All modules', 'Up to 25 users', '5 films', 'AI breakdown', 'Priority support']), 'is_active' => true],
            ['name' => 'Studio', 'price_npr' => 24999, 'price_usd' => 199, 'billing_cycle' => 'monthly', 'max_films' => 20, 'max_users_per_film' => 100, 'features' => json_encode(['Everything in Professional', 'Unlimited films', 'API access', 'White-label', 'Dedicated account manager', 'Custom integrations']), 'is_active' => true],
            ['name' => 'Yearly Professional', 'price_npr' => 99999, 'price_usd' => 799, 'billing_cycle' => 'yearly', 'max_films' => 5, 'max_users_per_film' => 25, 'features' => json_encode(['Same as Professional', '2 months free']), 'is_active' => true],
        ];
        foreach ($plans as $p) {
            DB::table('subscription_plans')->insert($p + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // FILM SUBSCRIPTIONS
        // ══════════════════════════════════════════════════════════════
        $plan1 = DB::table('subscription_plans')->where('name', 'Starter')->first();
        $plan2 = DB::table('subscription_plans')->where('name', 'Professional')->first();
        DB::table('film_subscriptions')->insert([
            ['film_id' => $f1, 'plan_id' => $plan2->id, 'status' => 'active', 'started_at' => '2026-05-15', 'expires_at' => '2026-12-31', 'payment_reference' => 'PAY-NEP-2026-001', 'created_at' => $now, 'updated_at' => $now],
            ['film_id' => $f2, 'plan_id' => $plan1->id, 'status' => 'trial', 'started_at' => '2026-08-01', 'expires_at' => '2026-09-01', 'payment_reference' => null, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ══════════════════════════════════════════════════════════════
        // SERIES
        // ══════════════════════════════════════════════════════════════
        $series1 = DB::table('series')->insertGetId([
            'title' => 'Loot Franchise', 'total_episodes' => 3, 'created_by' => $admin->id,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $series2 = DB::table('series')->insertGetId([
            'title' => 'Prem Geet Series', 'total_episodes' => 4, 'created_by' => $test->id,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('films')->where('id', $f1)->update(['series_id' => $series1]);
        DB::table('films')->where('id', $f2)->update(['series_id' => $series2]);

        // ══════════════════════════════════════════════════════════════
        // VENDORS — Film 1
        // ══════════════════════════════════════════════════════════════
        $vendors = [
            ['film_id' => $f1, 'name' => 'Kathmandu Camera Rentals', 'type' => 'Equipment', 'contact_name' => 'Rajesh Shrestha', 'contact_phone' => '9841300001', 'contact_email' => 'rajesh@kcr.com', 'address' => 'Thamel, Kathmandu', 'services' => 'Camera, lenses, lighting rental', 'rate' => 25000, 'currency' => 'NPR', 'is_active' => true, 'notes' => 'Preferred vendor. 10% discount for long-term rentals.'],
            ['film_id' => $f1, 'name' => 'Nepal Stunt Crew', 'type' => 'Stunts', 'contact_name' => 'Bhimsen Thapa', 'contact_phone' => '9841300002', 'contact_email' => 'bhimsen@stunts.com', 'address' => 'Lalitpur-5', 'services' => 'Stunt coordination, fire effects, wire work', 'rate' => 50000, 'currency' => 'NPR', 'is_active' => true, 'notes' => 'Professional team. Insurance covered.'],
            ['film_id' => $f1, 'name' => 'Himalayan Props & Sets', 'type' => 'Props', 'contact_name' => 'Anjana Rai', 'contact_phone' => '9841300003', 'contact_email' => 'anjana@props.com', 'address' => 'Baneshwor, Kathmandu', 'services' => 'Custom props, set construction, period furniture', 'rate' => 15000, 'currency' => 'NPR', 'is_active' => true, 'notes' => null],
            ['film_id' => $f1, 'name' => 'Catering Nepal Services', 'type' => 'Catering', 'contact_name' => 'Hari Bhattarai', 'contact_phone' => '9841300004', 'contact_email' => 'hari@catering.com', 'address' => 'New Baneshwor', 'services' => 'Full crew catering, snack bars, water supply', 'rate' => 450, 'currency' => 'NPR', 'is_active' => true, 'notes' => '450 per head per day. Includes dal bhat, snacks, tea.'],
            ['film_id' => $f1, 'name' => 'Sound Nepal Studio', 'type' => 'Audio', 'contact_name' => 'Mohan Gurung', 'contact_phone' => '9841300005', 'contact_email' => 'mohan@soundnepal.com', 'address' => 'Chabahil, Kathmandu', 'services' => 'Studio recording, Foley, sound mixing', 'rate' => 12000, 'currency' => 'NPR', 'is_active' => true, 'notes' => 'Booking required 1 week in advance.'],
            ['film_id' => $f1, 'name' => 'Quick Trans Logistics', 'type' => 'Transport', 'contact_name' => 'Sagar KC', 'contact_phone' => '9841300006', 'contact_email' => 'sagar@quicktrans.com', 'address' => 'Kalimati, Kathmandu', 'services' => 'Vehicle rental, equipment transport', 'rate' => 8000, 'currency' => 'NPR', 'is_active' => true, 'notes' => 'Trucks, vans, tempos available.'],
            ['film_id' => $f1, 'name' => 'Nepal Color Grading', 'type' => 'Post-Production', 'contact_name' => 'Rabin Poudel', 'contact_phone' => '9841300007', 'contact_email' => 'rabin@colorgrade.com', 'address' => 'Jhamsikhel, Lalitpur', 'services' => 'Color grading, VFX, DI', 'rate' => 35000, 'currency' => 'NPR', 'is_active' => false, 'notes' => 'Currently booked until Dec 2026.'],
        ];
        foreach ($vendors as $v) {
            DB::table('vendors')->insert($v + ['created_at' => $now, 'updated_at' => $now]);
        }

        // Vendors — Film 2
        foreach ([
            ['film_id' => $f2, 'name' => 'Pokhara Equipment Hub', 'type' => 'Equipment', 'contact_name' => 'Kiran Thapa', 'contact_phone' => '9854000001', 'contact_email' => 'kiran@peh.com', 'address' => 'Lakeside, Pokhara', 'services' => 'Camera, drone, gimbal rental', 'rate' => 18000, 'currency' => 'NPR', 'is_active' => true, 'notes' => null],
            ['film_id' => $f2, 'name' => 'Lake City Sound Lab', 'type' => 'Audio', 'contact_name' => 'Sneha Adhikari', 'contact_phone' => '9854000002', 'contact_email' => 'sneha@lakesound.com', 'address' => 'Mahendrapul, Pokhara', 'services' => 'Location sound, boom operators', 'rate' => 10000, 'currency' => 'NPR', 'is_active' => true, 'notes' => null],
            ['film_id' => $f2, 'name' => 'Mountain View Catering', 'type' => 'Catering', 'contact_name' => 'Ram Chapagain', 'contact_phone' => '9854000003', 'contact_email' => 'ram@mvc.com', 'address' => 'Sarangkot Road, Pokhara', 'services' => 'High-altitude crew catering', 'rate' => 550, 'currency' => 'NPR', 'is_active' => true, 'notes' => 'Specializes in high-altitude food delivery.'],
        ] as $v) {
            DB::table('vendors')->insert($v + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // SCRIPTS — Film 1
        // ══════════════════════════════════════════════════════════════
        $script1 = DB::table('scripts')->insertGetId([
            'film_id' => $f1, 'title' => 'Loot 3 — Final Draft v3', 'created_by' => $dir->id,
            'description' => 'Final shooting script. Revision 3. Includes all dialogue and camera directions.',
            'content' => "LOOT 3 — KATHMANDU HEIST\n\nFADE IN:\n\nEXT. ASAN MARKET — DAWN\n\nThe sun rises over the chaotic Asan market. Vegetable vendors, bicycles, and early shoppers.\n\nBHOLA DAI (50s, rugged, clever) surveys the area from a rooftop chai stall. RAJU (30s, nervous energy) joins him.\n\nBHOLA DAI\nSamjhiyau? Aaja ko din... yehi ho.\n\nRAJU\n(whispering)\nMalai ta pachha lagcha, dai.\n\nBHOLA DAI\n(grinning)\nPachha lageko manche le 7 crore jikdaina.\n\nINT. CREW VAN — CONTINUOUS\n\nThe crew — all five of them — crowded inside a parked Toyota Hiace. Bhola Dai draws the plan on a chalkboard.\n\nThe plan: 2 diversions, 1 vault team, 1 driver. 15 minutes max.\n\nEXT. PATAN DURBAR SQUARE — MORNING\n\nA flashmob of folk dancers distracts the security guards. Tourists join in. Pooja (30s, sharp, undercover) leads the chaos.\n\nINT. NEPAL BANK — VAULT ROOM\n\nThe vault door is open. Raju works the safe combination while Kancha keeps watch.\n\nEverything is going perfectly.\n\nUntil it isn't.\n\nINT. BANK LOBBY — CONTINUOUS\n\nThe bank manager walks in — and it's BHOLA DAI'S UNCLE.\n\nUNCLE\n(warmly)\nBhola? Timi? Yaha?\n\nAwkward silence.\n\nEXT. PATAN — EVENING CHASE\n\nPolice motorbikes. Crew on rickshaws. Tourists filming on phones. A goose chase through the UNESCO site.\n\nFADE TO BLACK.",
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // Script — Film 2
        $script2 = DB::table('scripts')->insertGetId([
            'film_id' => $f2, 'title' => 'Prem Geet 4 — Shooting Script', 'created_by' => $dir->id,
            'description' => 'First draft of the romantic musical set in Pokhara.',
            'content' => "PREM GEET 4 — HIMAL KO PREM\n\nFADE IN:\n\nEXT. PHEWA LAKE — SUNRISE\n\nMist rises from the still waters. The Annapurna range reflects on the lake.\n\nAARAV (28, brooding musician) sits in a boat, tuning his guitar. MAYA (26, free-spirited artist) paints on the shore.\n\nMAYA\n(calling out)\nTimro geet le pani chhuncha hola?\n\nAARAV\n(smiles)\nKoslai thaha? It hasn't met its listener yet.\n\nShe steps into a second boat. They float toward each other. The orchestra swells.\n\nSONG: \"Maya ko Samundra\"\n\nEXT. SARANGKOT VIEWPOINT — AFTERNOON\n\nPanoramic view of the Himalayas. Aarav and Maya sit side by side.\n\nBetween them, an unspoken question.\n\nFADE TO BLACK.",
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // Link scripts to existing scenes
        DB::table('scenes')->where('film_id', $f1)->update(['script_id' => $script1]);
        DB::table('scenes')->where('film_id', $f2)->update(['script_id' => $script2]);

        // ══════════════════════════════════════════════════════════════
        // BREAKDOWN ITEMS — Film 1 (per scene)
        // ══════════════════════════════════════════════════════════════
        $s1 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '1')->first();
        $s2 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '2')->first();
        $s3 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '3')->first();
        $s4 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '4')->first();
        $s5 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '5')->first();
        $s6 = DB::table('scenes')->where('film_id', $f1)->where('scene_number', '6')->first();

        $breakdownItems = [
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Bhola Dai (Saugat Malla)', 'quantity' => 1, 'notes' => 'Lead, rooftop chai scene'],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Raju (Dayahang Rai)', 'quantity' => 1, 'notes' => 'Joins on rooftop'],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Wooden chai cups (4)', 'quantity' => 4, 'notes' => 'Vendor stall props'],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Vegetable crates', 'quantity' => 20, 'notes' => 'Market dressing'],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'wardrobe', 'item_name' => 'Bhola: brown vest & topi', 'quantity' => 1, 'notes' => 'Rooftop scene'],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'category' => 'extras', 'item_name' => 'Market vendors/shoppers', 'quantity' => 30, 'notes' => 'Background: vegetable sellers, morning shoppers'],
            ['scene_id' => $s2->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Entire Heist Crew (5)', 'quantity' => 5, 'notes' => 'All 5 crew members in van'],
            ['scene_id' => $s2->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Chalkboard with plan diagram', 'quantity' => 1, 'notes' => 'Key prop — comedy reveal'],
            ['scene_id' => $s2->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Map of Kathmandu', 'quantity' => 1, 'notes' => 'Pinned on van wall'],
            ['scene_id' => $s2->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Walkie-talkie set', 'quantity' => 3, 'notes' => 'For crew communication'],
            ['scene_id' => $s2->id, 'film_id' => $f1, 'category' => 'vehicles', 'item_name' => 'Toyota Hiace van', 'quantity' => 1, 'notes' => 'White 2019 model. Crew vehicle.'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Pooja (Priya Thakur)', 'quantity' => 1, 'notes' => 'Leading flashmob'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Dhol/drum (folk music)', 'quantity' => 2, 'notes' => 'For dance flashmob'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'wardrobe', 'item_name' => 'Pooja: red/gold cultural dress', 'quantity' => 1, 'notes' => 'Undercover as dancer'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'extras', 'item_name' => 'Flashmob dancers', 'quantity' => 15, 'notes' => 'Folk dance ensemble'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'extras', 'item_name' => 'Tourists (extras)', 'quantity' => 20, 'notes' => 'Background at Durbar Square'],
            ['scene_id' => $s3->id, 'film_id' => $f1, 'category' => 'sfx', 'item_name' => 'Smoke machine (small)', 'quantity' => 1, 'notes' => 'For early morning mist effect'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Raju (Dayahang Rai)', 'quantity' => 1, 'notes' => 'Working vault combination'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Kancha (Hari KC)', 'quantity' => 1, 'notes' => 'Keeping watch'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Vault door (set piece)', 'quantity' => 1, 'notes' => 'Main heist set. Build cost: NPR 150,000'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Money bundles (prop)', 'quantity' => 100, 'notes' => 'Counterfeit notes for vault scene'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Safe combination tools', 'quantity' => 3, 'notes' => 'Stethoscope, drill, torch'],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'category' => 'wardrobe', 'item_name' => 'Raju: black gloves + cap', 'quantity' => 1, 'notes' => 'Heist outfit'],
            ['scene_id' => $s5->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Uncle (Bank Manager)', 'quantity' => 1, 'notes' => 'Supporting cast — comedy relief'],
            ['scene_id' => $s5->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Bhola Dai (Saugat Malla)', 'quantity' => 1, 'notes' => 'Caught in awkward moment'],
            ['scene_id' => $s5->id, 'film_id' => $f1, 'category' => 'wardrobe', 'item_name' => 'Uncle: bank manager suit', 'quantity' => 1, 'notes' => 'Official Nepal Bank uniform'],
            ['scene_id' => $s5->id, 'film_id' => $f1, 'category' => 'props', 'item_name' => 'Bank counter/desk', 'quantity' => 1, 'notes' => 'Lobby set dressing'],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'category' => 'vehicles', 'item_name' => 'Police motorbikes', 'quantity' => 3, 'notes' => 'For chase sequence'],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'category' => 'vehicles', 'item_name' => 'Rickshaws (cycle)', 'quantity' => 2, 'notes' => 'Crew escape vehicles. Need drivers.'],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'category' => 'cast', 'item_name' => 'Police officers', 'quantity' => 3, 'notes' => 'Pursuit team — action comedy'],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'category' => 'extras', 'item_name' => 'Street crowd', 'quantity' => 50, 'notes' => 'Heritage area pedestrians'],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'category' => 'sfx', 'item_name' => 'Siren/Police horn SFX', 'quantity' => 1, 'notes' => 'Post-production sound effect'],
        ];
        foreach ($breakdownItems as $bi) {
            DB::table('breakdown_items')->insert($bi + ['created_at' => $now, 'updated_at' => $now]);
        }

        // Breakdown items — Film 2 (Scene 1 — Phewa Lake song)
        $f2s1 = DB::table('scenes')->where('film_id', $f2)->where('scene_number', '1')->first();
        foreach ([
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'cast', 'item_name' => 'Aarav (Anmol KC)', 'quantity' => 1, 'notes' => 'Lead, boat song sequence'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'cast', 'item_name' => 'Maya (Samragyee Shah)', 'quantity' => 1, 'notes' => 'Lead, painting on shore'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'props', 'item_name' => 'Acoustic guitar', 'quantity' => 1, 'notes' => 'Aarav\'s prop. 12-string'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'props', 'item_name' => 'Easel + canvas + paints', 'quantity' => 1, 'notes' => 'Maya\'s art setup on shore'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'props', 'item_name' => 'Wooden boats (traditional)', 'quantity' => 2, 'notes' => 'One for Aarav, one for Maya'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'wardrobe', 'item_name' => 'Aarav: casual white shirt', 'quantity' => 1, 'notes' => 'Boat scene costume'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'wardrobe', 'item_name' => 'Maya: red silk sari', 'quantity' => 1, 'notes' => 'Song sequence. Hand-embroidered.'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'extras', 'item_name' => 'Boat rowers', 'quantity' => 2, 'notes' => 'Traditional boatmen for each boat'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'extras', 'item_name' => 'Morning tourists (bg)', 'quantity' => 10, 'notes' => 'Lakeside promenade background'],
            ['scene_id' => $f2s1->id, 'film_id' => $f2, 'category' => 'sfx', 'item_name' => 'Light fog machine', 'quantity' => 2, 'notes' => 'For sunrise mist effect on lake'],
        ] as $bi) {
            DB::table('breakdown_items')->insert($bi + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // SHOT LISTS — Film 1 (Scene 1 & 4)
        // ══════════════════════════════════════════════════════════════
        foreach ([
            ['scene_id' => $s1->id, 'film_id' => $f1, 'shot_number' => '1A', 'shot_type' => 'Wide', 'camera_angle' => 'High angle from rooftop', 'lens_mm' => 24, 'movement' => 'Static', 'description' => 'Establishing shot of Asan market at dawn', 'duration_seconds' => 15, 'status' => 'Completed', 'created_by' => $dir->id],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'shot_number' => '1B', 'shot_type' => 'Medium', 'camera_angle' => 'Eye level', 'lens_mm' => 50, 'movement' => 'Handheld', 'description' => 'Bhola Dai sipping chai, surveying market', 'duration_seconds' => 25, 'status' => 'Completed', 'created_by' => $dir->id],
            ['scene_id' => $s1->id, 'film_id' => $f1, 'shot_number' => '1C', 'shot_type' => 'Close-up', 'camera_angle' => 'Over-shoulder', 'lens_mm' => 85, 'movement' => 'Slow push-in', 'description' => 'Raju arrives, nervous. Reaction close-up.', 'duration_seconds' => 20, 'status' => 'Completed', 'created_by' => $dir->id],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'shot_number' => '4A', 'shot_type' => 'Close-up', 'camera_angle' => 'Over shoulder', 'lens_mm' => 100, 'movement' => 'Static', 'description' => 'Raju\'s hands working vault combination', 'duration_seconds' => 30, 'status' => 'Completed', 'created_by' => $dir->id],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'shot_number' => '4B', 'shot_type' => 'Medium', 'camera_angle' => 'Low angle', 'lens_mm' => 35, 'movement' => 'Dolly back', 'description' => 'Vault door creaks open, revealing money', 'duration_seconds' => 10, 'status' => 'Completed', 'created_by' => $dir->id],
            ['scene_id' => $s4->id, 'film_id' => $f1, 'shot_number' => '4C', 'shot_type' => 'Wide', 'camera_angle' => 'Eye level', 'lens_mm' => 24, 'movement' => 'Steadicam', 'description' => 'Full vault room reveal. Raju + Kancha react.', 'duration_seconds' => 20, 'status' => 'In Progress', 'created_by' => $dir->id],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'shot_number' => '6A', 'shot_type' => 'Wide', 'camera_angle' => 'Aerial', 'lens_mm' => 16, 'movement' => 'Drone follow', 'description' => 'Aerial drone shot — rickshaws racing through Patan', 'duration_seconds' => 35, 'status' => 'Not Started', 'created_by' => $dir->id],
            ['scene_id' => $s6->id, 'film_id' => $f1, 'shot_number' => '6B', 'shot_type' => 'Action', 'camera_angle' => 'Side angle', 'lens_mm' => 50, 'movement' => 'Tracking', 'description' => 'Police motorbikes weaving through traffic', 'duration_seconds' => 20, 'status' => 'Not Started', 'created_by' => $dir->id],
        ] as $sl) {
            DB::table('shot_lists')->insert($sl + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // CAST AVAILABILITY (Day Out of Days) — Film 1
        // ══════════════════════════════════════════════════════════════
        $castMembers = DB::table('cast_crew')->where('film_id', $f1)->where('role_type', 'Cast')->get();
        $shootDates = ['2026-07-01', '2026-07-03', '2026-07-05', '2026-07-08', '2026-07-10', '2026-07-15', '2026-07-17', '2026-07-20'];
        foreach ($castMembers as $cm) {
            foreach ($shootDates as $i => $date) {
                $status = match (true) {
                    $i < 3 => 'required',
                    $i < 5 => 'available',
                    $i >= 5 && $cm->id % 2 === 0 => 'hold',
                    default => 'not_required',
                };
                DB::table('cast_availability')->insert([
                    'cast_crew_id' => $cm->id,
                    'film_id' => $f1,
                    'shoot_date' => $date,
                    'status' => $status,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }

        // ══════════════════════════════════════════════════════════════
        // DAILY PRODUCTION REPORTS — Film 1
        // ══════════════════════════════════════════════════════════════
        $schedIds = DB::table('schedules')->where('film_id', $f1)->pluck('id');
        $dprs = [
            ['film_id' => $f1, 'schedule_id' => $schedIds[0], 'report_date' => '2026-07-01', 'scenes_scheduled' => 2, 'scenes_completed' => 2, 'pages_scheduled' => 5.5, 'pages_completed' => 5.5, 'crew_count' => 45, 'total_hours' => 12.5, 'daily_expenses' => 185000, 'notes_director' => 'Excellent first day. Saugat and Dayahang have great chemistry. Market scenes exceeded expectations.', 'notes_pm' => 'On budget. Crew morale high. Catering feedback positive. Crowd control smooth.', 'sent_to' => json_encode(['admin@nepalfilmos.com', 'director@nepalfilmos.com'])],
            ['film_id' => $f1, 'schedule_id' => $schedIds[1], 'report_date' => '2026-07-03', 'scenes_scheduled' => 1, 'scenes_completed' => 1, 'pages_scheduled' => 4.0, 'pages_completed' => 4.0, 'crew_count' => 48, 'total_hours' => 13.0, 'daily_expenses' => 210000, 'notes_director' => 'Flashmob took 6 takes but the result is fantastic. Patan DP looks gorgeous.', 'notes_pm' => 'Heritage permit in place. Security deposit paid. No incidents.', 'sent_to' => json_encode(['admin@nepalfilmos.com', 'director@nepalfilmos.com'])],
            ['film_id' => $f1, 'schedule_id' => $schedIds[2], 'report_date' => '2026-07-05', 'scenes_scheduled' => 2, 'scenes_completed' => 1, 'pages_scheduled' => 8.5, 'pages_completed' => 5.5, 'crew_count' => 52, 'total_hours' => 14.0, 'daily_expenses' => 320000, 'notes_director' => 'Vault shot 4A/B excellent. Scene 5 postponed to Day 4 — uncle actor unwell.', 'notes_pm' => 'Bank set running slightly over on construction costs. Need to revise budget for set department.', 'sent_to' => json_encode(['admin@nepalfilmos.com'])],
            ['film_id' => $f1, 'schedule_id' => $schedIds[3], 'report_date' => '2026-07-08', 'scenes_scheduled' => 1, 'scenes_completed' => 0, 'pages_scheduled' => 3.0, 'pages_completed' => 0, 'crew_count' => 18, 'total_hours' => 6.0, 'daily_expenses' => 85000, 'notes_director' => 'Light unit only — small corrections. Scene 5 postponed again due to weather.', 'notes_pm' => 'Minimal crew day. Saved on catering and transport costs.', 'sent_to' => null],
        ];
        foreach ($dprs as $dpr) {
            DB::table('daily_production_reports')->insert($dpr + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // DOCUMENTS — Film 1
        // ══════════════════════════════════════════════════════════════
        $docs = [
            ['film_id' => $f1, 'folder' => 'Contracts', 'document_name' => 'Saugat Malla — Actor Agreement', 'file_path' => 'contracts/saugat_malla_actor_agreement_v2.pdf', 'file_type' => 'application/pdf', 'file_size' => 245000, 'access_roles' => json_encode(['Producer', 'Production Manager']), 'version' => 2, 'expires_at' => '2026-12-31', 'is_confidential' => true, 'uploaded_by' => $admin->id],
            ['film_id' => $f1, 'folder' => 'Contracts', 'document_name' => 'Dayahang Rai — Actor Agreement', 'file_path' => 'contracts/dayahang_rai_actor_agreement_v1.pdf', 'file_type' => 'application/pdf', 'file_size' => 238000, 'access_roles' => json_encode(['Producer', 'Production Manager']), 'version' => 1, 'expires_at' => '2026-12-31', 'is_confidential' => true, 'uploaded_by' => $admin->id],
            ['film_id' => $f1, 'folder' => 'Permits', 'document_name' => 'Patan Durbar Square — Film Permit', 'file_path' => 'permits/patan_durbar_square_film_permit.pdf', 'file_type' => 'application/pdf', 'file_size' => 89000, 'access_roles' => json_encode(['Producer', 'Director', 'Production Manager']), 'version' => 1, 'expires_at' => '2026-12-31', 'is_confidential' => false, 'uploaded_by' => $pm->id],
            ['film_id' => $f1, 'folder' => 'Permits', 'document_name' => 'Nepal Bank — Interior Shooting NOC', 'file_path' => 'permits/nepal_bank_noc.pdf', 'file_type' => 'application/pdf', 'file_size' => 56000, 'access_roles' => json_encode(['Production Manager']), 'version' => 1, 'expires_at' => '2026-07-15', 'is_confidential' => false, 'uploaded_by' => $pm->id],
            ['film_id' => $f1, 'folder' => 'Scripts', 'document_name' => 'Loot 3 — Shooting Script v3', 'file_path' => 'scripts/LOOT3_SHOOTING_V3.pdf', 'file_type' => 'application/pdf', 'file_size' => 420000, 'access_roles' => json_encode(['Producer', 'Director', '1st AD', 'DOP']), 'version' => 3, 'expires_at' => null, 'is_confidential' => true, 'uploaded_by' => $dir->id],
            ['film_id' => $f1, 'folder' => 'Budgets', 'document_name' => 'Loot 3 — Production Budget v4', 'file_path' => 'budgets/LOOT3_BUDGET_V4.xlsx', 'file_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'file_size' => 180000, 'access_roles' => json_encode(['Producer', 'Production Manager']), 'version' => 4, 'expires_at' => null, 'is_confidential' => false, 'uploaded_by' => $admin->id],
            ['film_id' => $f1, 'folder' => 'Insurance', 'document_name' => 'Production Insurance Policy', 'file_path' => 'insurance/production_insurance_2026.pdf', 'file_type' => 'application/pdf', 'file_size' => 750000, 'access_roles' => json_encode(['Producer']), 'version' => 1, 'expires_at' => '2026-12-31', 'is_confidential' => true, 'uploaded_by' => $admin->id],
            ['film_id' => $f1, 'folder' => 'General', 'document_name' => 'Call Sheet Template', 'file_path' => 'general/call_sheet_template.docx', 'file_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'file_size' => 45000, 'access_roles' => json_encode(['Director', 'Production Manager', '1st AD']), 'version' => 1, 'expires_at' => null, 'is_confidential' => false, 'uploaded_by' => $pm->id],
        ];
        foreach ($docs as $d) {
            DB::table('documents')->insert($d + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // MESSAGES — Film 1
        // ══════════════════════════════════════════════════════════════
        $msgData = [
            ['film_id' => $f1, 'sender_id' => $dir->id, 'receiver_id' => $pm->id, 'message' => 'Priya, tomorrow\'s bank interior — can we push crew call by 30 mins? DOP wants better morning light for the vault shot.', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $pm->id, 'receiver_id' => $dir->id, 'message' => 'Sure Deepak ji. Will update call sheet and notify everyone. Shall I push to 5:30?', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $dir->id, 'receiver_id' => $pm->id, 'message' => '5:30 works. Also, can we arrange backup generator? Bank says power cuts possible.', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $admin->id, 'receiver_id' => null, 'message' => '⚠️ REMINDER: Budget review meeting this Friday at 2pm in production office. All department heads must attend.', 'is_announcement' => true, 'is_pinned' => true],
            ['film_id' => $f1, 'sender_id' => $pm->id, 'receiver_id' => $admin->id, 'message' => 'Suresh ji, the set construction cost for the bank vault is running 20% over estimate. Need approval for additional NPR 45,000.', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $admin->id, 'receiver_id' => $pm->id, 'message' => 'Approved. Adjust from miscellaneous contingency. Let\'s keep the rest within budget.', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $dir->id, 'receiver_id' => null, 'message' => '📢 Team — yesterday\'s footage is looking incredible. The Patan flashmob is going to be one of the best sequences in Nepali cinema. Proud of everyone!', 'is_announcement' => true, 'is_pinned' => true],
            ['film_id' => $f1, 'sender_id' => $pm->id, 'receiver_id' => $dir->id, 'message' => 'Deepak ji, the uncle actor is still unwell. Should we recast or wait 2 more days?', 'is_announcement' => false, 'is_pinned' => false],
            ['film_id' => $f1, 'sender_id' => $dir->id, 'receiver_id' => $pm->id, 'message' => 'Wait 2 days. Nobody can play that role like he can. We\'ll shoot Scene 3 pickups in the meantime.', 'is_announcement' => false, 'is_pinned' => false],
        ];
        foreach ($msgData as $m) {
            $msgId = DB::table('messages')->insertGetId($m + ['created_at' => $now, 'updated_at' => $now]);
            if ($m['receiver_id']) {
                DB::table('message_reads')->insert([
                    'message_id' => $msgId,
                    'user_id' => $m['receiver_id'],
                    'read_at' => $now,
                ]);
            }
        }

        // ══════════════════════════════════════════════════════════════
        // NOTIFICATIONS
        // ══════════════════════════════════════════════════════════════
        $notifications = [
            ['user_id' => $admin->id, 'film_id' => $f1, 'type' => 'expense_approved', 'title' => 'Expense Approved', 'body' => 'Camera equipment rental (NPR 120,000) has been approved.', 'data' => json_encode(['expense_id' => 1, 'amount' => 120000]), 'is_read' => true],
            ['user_id' => $admin->id, 'film_id' => $f1, 'type' => 'budget_alert', 'title' => 'Budget Alert: Set Construction', 'body' => 'Vault set construction is 20% over budget. Extra NPR 45,000 needed.', 'data' => json_encode(['department' => 'Art', 'overage' => 45000]), 'is_read' => false],
            ['user_id' => $dir->id, 'film_id' => $f1, 'type' => 'call_sheet_sent', 'title' => 'Call Sheet Published', 'body' => 'Tomorrow\'s call sheet (Day 4, July 8) has been published. Crew call: 6:00 AM.', 'data' => json_encode(['schedule_id' => $schedIds[3], 'call_time' => '06:00']), 'is_read' => true],
            ['user_id' => $dir->id, 'film_id' => $f1, 'type' => 'task_assigned', 'title' => 'Task: Review Scene 5 Rewrite', 'body' => 'PM has requested script revision for Scene 5. Due: July 10.', 'data' => json_encode(['task_id' => 1]), 'is_read' => false],
            ['user_id' => $pm->id, 'film_id' => $f1, 'type' => 'expense_submitted', 'title' => 'New Expense Submitted', 'body' => 'Crew salaries week 1 (NPR 195,000) pending your approval.', 'data' => json_encode(['expense_id' => 16, 'amount' => 195000]), 'is_read' => false],
            ['user_id' => $test->id, 'film_id' => $f2, 'type' => 'film_update', 'title' => 'Pre-Production Update', 'body' => 'Prem Geet 4 pre-production is on track. Budget approved. Locations locked.', 'data' => json_encode(['film_id' => $f2, 'status' => 'Pre-Production']), 'is_read' => true],
        ];
        foreach ($notifications as $n) {
            DB::table('notifications')->insert($n + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // ACTIVITY LOGS
        // ══════════════════════════════════════════════════════════════
        $activities = [
            ['film_id' => $f1, 'user_id' => $admin->id, 'action' => 'created', 'module' => 'films', 'record_type' => 'Film', 'record_id' => $f1, 'old_value' => null, 'new_value' => json_encode(['status' => 'Production', 'title' => 'Loot 3 — Kathmandu Heist']), 'ip_address' => '192.168.1.10'],
            ['film_id' => $f1, 'user_id' => $admin->id, 'action' => 'updated', 'module' => 'films', 'record_type' => 'Film', 'record_id' => $f1, 'old_value' => json_encode(['status' => 'Pre-Production']), 'new_value' => json_encode(['status' => 'Production']), 'ip_address' => '192.168.1.10'],
            ['film_id' => $f1, 'user_id' => $pm->id, 'action' => 'created', 'module' => 'locations', 'record_type' => 'Location', 'record_id' => 1, 'old_value' => null, 'new_value' => json_encode(['name' => 'Asan Tole']), 'ip_address' => '192.168.1.15'],
            ['film_id' => $f1, 'user_id' => $pm->id, 'action' => 'created', 'module' => 'schedules', 'record_type' => 'Schedule', 'record_id' => 1, 'old_value' => null, 'new_value' => json_encode(['day_number' => 1, 'shoot_date' => '2026-07-01']), 'ip_address' => '192.168.1.15'],
            ['film_id' => $f1, 'user_id' => $dir->id, 'action' => 'approved', 'module' => 'progress', 'record_type' => 'ProgressUpdate', 'record_id' => 1, 'old_value' => json_encode(['status' => 'Pending Review']), 'new_value' => json_encode(['status' => 'Completed']), 'ip_address' => '192.168.1.20'],
            ['film_id' => $f1, 'user_id' => $admin->id, 'action' => 'approved', 'module' => 'expenses', 'record_type' => 'Expense', 'record_id' => 1, 'old_value' => json_encode(['status' => 'Pending']), 'new_value' => json_encode(['status' => 'Approved']), 'ip_address' => '192.168.1.10'],
            ['film_id' => $f2, 'user_id' => $test->id, 'action' => 'created', 'module' => 'films', 'record_type' => 'Film', 'record_id' => $f2, 'old_value' => null, 'new_value' => json_encode(['title' => 'Prem Geet 4']), 'ip_address' => '192.168.1.30'],
        ];
        foreach ($activities as $a) {
            DB::table('activity_logs')->insert($a + ['user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // TIME SHEETS — Film 1
        // ══════════════════════════════════════════════════════════════
        $crewMembers = DB::table('cast_crew')->where('film_id', $f1)->where('role_type', 'Crew')->get();
        $dates = ['2026-07-01', '2026-07-03', '2026-07-05'];
        foreach ($crewMembers as $i => $cm) {
            foreach ($dates as $j => $date) {
                $checkIn = sprintf('%02d:%02d:00', 5, rand(0, 3) * 15 + 30);
                $checkOut = sprintf('%02d:%02d:00', 17 + rand(0, 2), rand(0, 3) * 15);
                $total = round((strtotime($checkOut) - strtotime($checkIn)) / 3600, 1);
                $overtime = max(0, round($total - 10, 1));
                $statuses = ['draft', 'submitted', 'approved'];
                $status = $statuses[$j];
                DB::table('time_sheets')->insert([
                    'film_id' => $f1,
                    'user_id' => $pm->id,
                    'shoot_date' => $date,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'break_minutes' => 45,
                    'total_hours' => $total,
                    'overtime_hours' => $overtime,
                    'notes' => "Day $j regular shoot",
                    'status' => $status,
                    'approved_by' => $status === 'approved' ? $admin->id : null,
                    'submitted_at' => $status !== 'draft' ? $now : null,
                    'approved_at' => $status === 'approved' ? $now : null,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }

        // ══════════════════════════════════════════════════════════════
        // MEDIA
        // ══════════════════════════════════════════════════════════════
        $mediaItems = [
            ['user_id' => $pm->id, 'filename' => 'poster_loot3.jpg', 'original_name' => 'Loot 3 Poster Concept.jpg', 'mime_type' => 'image/jpeg', 'size' => 2450000, 'path' => 'media/posters/loot3_poster.jpg', 'type' => 'image'],
            ['user_id' => $dir->id, 'filename' => 'scene1_breakdown.png', 'original_name' => 'Scene 1 Storyboard.png', 'mime_type' => 'image/png', 'size' => 1800000, 'path' => 'media/storyboards/scene1.png', 'type' => 'image'],
            ['user_id' => $pm->id, 'filename' => 'location_asan.jpg', 'original_name' => 'Asan Market Recce.jpg', 'mime_type' => 'image/jpeg', 'size' => 3200000, 'path' => 'media/locations/asan_recce.jpg', 'type' => 'image'],
            ['user_id' => $pm->id, 'filename' => 'location_patan.jpg', 'original_name' => 'Patan Durbar Square.jpg', 'mime_type' => 'image/jpeg', 'size' => 4100000, 'path' => 'media/locations/patan_square.jpg', 'type' => 'image'],
            ['user_id' => $dir->id, 'filename' => 'bts_day1.mp4', 'original_name' => 'Behind the Scenes Day 1.mp4', 'mime_type' => 'video/mp4', 'size' => 15000000, 'path' => 'media/bts/day1_bts.mp4', 'type' => 'video'],
            ['user_id' => $admin->id, 'filename' => 'logo_white.png', 'original_name' => 'Nepal Film OS Logo White.png', 'mime_type' => 'image/png', 'size' => 450000, 'path' => 'media/brand/logo_white.png', 'type' => 'image'],
            ['user_id' => $pm->id, 'filename' => 'call_sheet_day1.pdf', 'original_name' => 'Call Sheet Day 1.pdf', 'mime_type' => 'application/pdf', 'size' => 320000, 'path' => 'media/documents/call_sheet_day1.pdf', 'type' => 'document'],
            ['user_id' => $test->id, 'filename' => 'prem_geet_logo.png', 'original_name' => 'Prem Geet 4 Logo.png', 'mime_type' => 'image/png', 'size' => 680000, 'path' => 'media/posters/prem_geet4_logo.png', 'type' => 'image'],
        ];
        foreach ($mediaItems as $m) {
            DB::table('media')->insert($m + ['created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // NEWS CATEGORIES
        // ══════════════════════════════════════════════════════════════
        $cats = [
            ['name' => 'Industry News', 'slug' => 'industry-news', 'color' => '#f59e0b'],
            ['name' => 'Film Reviews', 'slug' => 'film-reviews', 'color' => '#3b82f6'],
            ['name' => 'Technology', 'slug' => 'technology', 'color' => '#10b981'],
            ['name' => 'Interviews', 'slug' => 'interviews', 'color' => '#8b5cf6'],
            ['name' => 'Production Tips', 'slug' => 'production-tips', 'color' => '#ec4899'],
            ['name' => 'Nepali Cinema', 'slug' => 'nepali-cinema', 'color' => '#ef4444'],
            ['name' => 'Festivals & Events', 'slug' => 'festivals-events', 'color' => '#14b8a6'],
        ];
        foreach ($cats as $c) {
            DB::table('news_categories')->insert($c + ['is_active' => true, 'created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // NEWS ARTICLES
        // ══════════════════════════════════════════════════════════════
        $catIds = DB::table('news_categories')->pluck('id', 'slug');
        $articles = [
            ['title' => 'Nepali Film Industry Sees Record Production in 2026', 'slug' => 'nepali-film-industry-record-2026', 'description' => 'Over 120 films registered for production this year, marking a historic high for Nepali cinema.', 'content' => 'The Nepali film industry has witnessed an unprecedented boom in 2026, with over 120 films registered for production across the country. This marks a 40% increase compared to the previous year, driven by improved financing options, streaming platform demand, and growing international interest in Nepali storytelling.\n\nKathmandu valley alone accounts for 65 productions, while regional film industries in Pokhara, Chitwan, and Biratnagar are also seeing significant growth. Industry experts attribute this surge to the success of recent blockbusters and the expansion of digital distribution.', 'source' => 'The Kathmandu Post', 'source_logo' => null, 'category_id' => $catIds['industry-news'], 'image_url' => null, 'author_name' => 'Sagar Thapa', 'published_at' => '2026-06-28 09:00:00', 'is_published' => true, 'is_external' => false],
            ['title' => 'How Digital Tools Are Transforming Nepali Film Production', 'slug' => 'digital-tools-nepali-film-production', 'description' => 'From cloud-based script management to AI-powered breakdowns, technology is reshaping how Nepali films are made.', 'content' => 'Gone are the days when Nepali film production relied solely on paper call sheets and physical clipboards. A new wave of digital tools — including Nepal Film OS — is bringing modern production management to the Himalayan film industry.\n\nKey technologies making an impact:\n\n1. **Cloud-based script management** — allowing real-time collaboration between writers, directors, and producers\n2. **Digital call sheets** — reducing paper waste and ensuring instant crew notifications\n3. **AI breakdown tools** — automatically identifying cast, props, and wardrobe needs from scripts\n4. **Budget tracking software** — providing real-time visibility into production spending\n\n"Before Nepal Film OS, we used spreadsheets and WhatsApp groups. It was chaos," says producer Suresh Sharma. "Now everything is in one place — schedules, budgets, call sheets, even the Day Out of Days."', 'source' => 'Tech Nepal', 'source_logo' => null, 'category_id' => $catIds['technology'], 'image_url' => null, 'author_name' => 'Anita Basnet', 'published_at' => '2026-06-25 11:30:00', 'is_published' => true, 'is_external' => false],
            ['title' => 'Dayahang Rai on Loot 3: "This is the wildest script I\'ve read"', 'slug' => 'dayahang-rai-loot-3-interview', 'description' => 'In an exclusive interview, the celebrated actor shares his excitement about the upcoming heist comedy.', 'content' => 'Dayahang Rai, one of Nepal\'s most versatile actors, is gearing up for what he calls "the most fun I\'ve had on a set." Playing Raju, the nervous sidekick in Loot 3, he brings his signature comic timing to the heist genre.\n\n"I read the script and laughed out loud," says Dayahang. "This isn\'t just a heist film — it\'s a celebration of Nepali humor. The chase sequence through Patan Durbar Square is going to be iconic."\n\nLoot 3 follows the original crew\'s biggest heist yet. With a budget of NPR 5 crore, it\'s one of the most ambitious Nepali comedies of 2026.', 'source' => 'Cinepati Magazine', 'source_logo' => null, 'category_id' => $catIds['interviews'], 'image_url' => null, 'author_name' => 'Rajan Shrestha', 'published_at' => '2026-06-20 14:00:00', 'is_published' => true, 'is_external' => false],
            ['title' => '10 Essential Pre-Production Checklists for Independent Films', 'slug' => 'essential-pre-production-checklists', 'description' => 'Save time and money with these comprehensive pre-production checklists tailored for independent filmmakers.', 'content' => 'Pre-production is where films are made — or broken. For independent filmmakers working with limited budgets, a thorough pre-production process is essential.\n\n## 1. Script Breakdown\nBefore anything else, break down your script scene by scene. Identify every cast member, prop, location, and special effect.\n\n## 2. Budget Planning\nCreate a realistic budget that accounts for contingencies (typically 10-15% of total budget).\n\n## 3. Scheduling\nUse production scheduling software to plan shoot days based on location, cast availability, and daylight hours.\n\n## 4. Permits & Legal\nSecure all location permits, actor agreements, and insurance before the first shoot day.\n\n## 5. Crew Hiring\nBuild your core team early — DOP, 1st AD, Production Manager, and Sound Designer.\n\nModern tools like Nepal Film OS integrate all of these into a single platform, making independent production management accessible to everyone.', 'source' => 'FilmMaker Nepal', 'source_logo' => null, 'category_id' => $catIds['production-tips'], 'image_url' => null, 'author_name' => 'Priya Shrestha', 'published_at' => '2026-06-18 10:00:00', 'is_published' => true, 'is_external' => false],
            ['title' => 'Review: "Fulbari" — A Quiet Masterpiece from Nepal', 'slug' => 'review-fulbari-masterpiece', 'description' => 'A deeply moving family drama that proves Nepali cinema is entering a golden age.', 'content' => '"Fulbari" (The Flower Garden) is not a film that shouts for attention. It whispers. And in its quietness, it achieves something remarkable — it stays with you long after the credits roll.\n\nDirector Anup Poudel crafts a tender story of an elderly couple navigating the changing landscape of Kathmandu. As their neighborhood transforms into high-rise apartments, they hold onto their small garden — a metaphor for memory, love, and resistance.\n\nThe performances are extraordinary. Veteran actor Madan Krishna Shrestha delivers a career-best performance, balancing vulnerability with quiet dignity.\n\nRating: ★★★★½', 'source' => 'Nepal Film Review', 'source_logo' => null, 'category_id' => $catIds['film-reviews'], 'image_url' => null, 'author_name' => 'Maya Gurung', 'published_at' => '2026-06-15 16:00:00', 'is_published' => true, 'is_external' => false],
            ['title' => 'Nepal\'s Oscar Entry 2026: "Himalaya\'s Last Song" Selected', 'slug' => 'nepal-oscar-entry-2026', 'description' => 'The Nepali film industry celebrates as "Himalaya\'s Last Song" is selected as the official entry for the Academy Awards.', 'content' => 'For the second consecutive year, Nepal has submitted a film for consideration at the Academy Awards. "Himalaya\'s Last Song," directed by acclaimed filmmaker Nabin Subba, has been selected as the official Nepali entry for Best International Feature Film.\n\nThe film tells the story of a dying Sherpa community in the high Himalayas and their struggle to preserve their musical traditions in the face of climate change and modernization. Shot over three years in the Khumbu region, the film features breathtaking cinematography and a haunting original score.\n\n"This is a proud moment for Nepali cinema," says Subba. "We are telling our stories to the world."', 'source' => 'Onlinekhabar', 'source_logo' => null, 'category_id' => $catIds['nepali-cinema'], 'image_url' => null, 'author_name' => 'Kiran Joshi', 'published_at' => '2026-06-10 12:00:00', 'is_published' => true, 'is_external' => false],
            ['title' => 'Kathmandu International Film Festival Opens Next Month', 'slug' => 'kathmandu-international-film-festival-2026', 'description' => 'The 12th edition of KIFF promises 150+ films from 40 countries across 8 venues.', 'content' => 'The Kathmandu International Film Festival (KIFF) returns for its 12th edition from July 15-22, 2026. This year\'s festival features over 150 films from 40 countries, with a special focus on South Asian cinema.\n\nHighlights include:\n- Opening night: "Fulbari" (Nepal)\n- South Asian competition section (12 films)\n- Documentary masterclass by renowned filmmaker\n- Youth filmmaking workshop for aspiring Nepali directors\n- Networking events connecting Nepali producers with international distributors\n\nVenues include Kumari Cinema Hall, Mandala Theatre, and outdoor screenings at Basantapur Durbar Square.', 'source' => 'KIFF Press Release', 'source_logo' => null, 'category_id' => $catIds['festivals-events'], 'image_url' => null, 'author_name' => 'KIFF Media Team', 'published_at' => '2026-06-08 09:00:00', 'is_published' => true, 'is_external' => false],
        ];
        foreach ($articles as $a) {
            DB::table('news_articles')->insert($a + ['user_id' => $admin->id, 'created_at' => $now, 'updated_at' => $now]);
        }

        // ══════════════════════════════════════════════════════════════
        // SCRIPTS — film 2 scenes
        // ══════════════════════════════════════════════════════════════
        $f2s2 = DB::table('scenes')->insertGetId([
            'film_id' => $f2, 'script_id' => $script2, 'scene_number' => '1A',
            'scene_heading' => 'EXT. SARANGKOT VIEWPOINT — AFTERNOON', 'int_ext' => 'EXT',
            'location_id' => DB::table('locations')->where('film_id', $f2)->where('name', 'like', '%Sarangkot%')->first()->id,
            'day_or_night' => 'DAY', 'page_count' => 3.0,
            'summary' => 'Aarav and Maya share a quiet moment overlooking the Himalayas. Deep conversation about dreams and destiny.',
            'status' => 'Not Started', 'order_index' => 2,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        echo "✅ Dummy data seeded successfully!\n";
        echo "  • " . DB::table('subscription_plans')->count() . " subscription plans\n";
        echo "  • " . DB::table('film_subscriptions')->count() . " film subscriptions\n";
        echo "  • " . DB::table('series')->count() . " series\n";
        echo "  • " . DB::table('vendors')->count() . " vendors\n";
        echo "  • " . DB::table('scripts')->count() . " scripts\n";
        echo "  • " . DB::table('breakdown_items')->count() . " breakdown items\n";
        echo "  • " . DB::table('shot_lists')->count() . " shot lists\n";
        echo "  • " . DB::table('cast_availability')->count() . " cast availability records\n";
        echo "  • " . DB::table('daily_production_reports')->count() . " DPRs\n";
        echo "  • " . DB::table('documents')->count() . " documents\n";
        echo "  • " . DB::table('messages')->count() . " messages\n";
        echo "  • " . DB::table('notifications')->count() . " notifications\n";
        echo "  • " . DB::table('activity_logs')->count() . " activity logs\n";
        echo "  • " . DB::table('time_sheets')->count() . " time sheets\n";
        echo "  • " . DB::table('media')->count() . " media files\n";
        echo "  • " . DB::table('news_categories')->count() . " news categories\n";
        echo "  • " . DB::table('news_articles')->count() . " news articles\n";
    }
}
