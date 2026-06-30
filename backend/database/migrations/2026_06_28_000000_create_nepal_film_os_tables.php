<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. films
        Schema::create('films', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('poster_image')->nullable();
            $table->string('genre')->nullable();
            $table->string('language')->default('Nepali');
            $table->string('production_company')->nullable();
            $table->string('status')->default('Pre-Production'); // Pre-Production, Production, Post-Production, Completed
            $table->date('start_date')->nullable();
            $table->date('expected_wrap_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 2. film_users (pivot table for role-per-film)
        Schema::create('film_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role'); // Super Admin, Producer, Director, Production Manager, Department Head, Crew
            $table->string('department')->nullable();
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['film_id', 'user_id']);
            $table->index(['film_id', 'role']);
        });

        // 3. film_modules
        Schema::create('film_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('module_name');
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['film_id', 'module_name']);
        });

        // 4. locations
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('name');
            $table->string('address')->nullable();
            $table->decimal('gps_lat', 10, 8)->nullable();
            $table->decimal('gps_lng', 11, 8)->nullable();
            $table->json('photos')->nullable();
            $table->string('permit_status')->default('Not Required'); // Not Required, Pending, Approved, Rejected
            $table->string('permit_document')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('parking_info')->nullable();
            $table->text('facilities_notes')->nullable();
            $table->timestamps();
        });

        // 5. schedules
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->integer('day_number');
            $table->date('shoot_date');
            $table->string('status')->default('Scheduled'); // Scheduled, In Progress, Completed, Postponed
            $table->time('call_time')->nullable();
            $table->time('wrap_time')->nullable();
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['film_id', 'shoot_date']);
        });

        // 6. scenes
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('scene_number');
            $table->text('scene_heading');
            $table->string('int_ext')->default('INT'); // INT, EXT, INT/EXT
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->string('day_or_night')->default('DAY'); // DAY, NIGHT, DAWN, DUSK
            $table->decimal('page_count', 4, 2)->default(0.00);
            $table->text('summary')->nullable();
            $table->string('status')->default('Not Started'); // Not Started, In Progress, Completed, Postponed
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->index(['film_id', 'scene_number']);
        });

        // 7. scene_schedule
        Schema::create('scene_schedule', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->foreignId('scene_id')->constrained('scenes')->onDelete('cascade');
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        // 8. cast_crew
        Schema::create('cast_crew', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name');
            $table->string('photo')->nullable();
            $table->string('role_type'); // Cast, Crew
            $table->string('role_name'); // e.g., Actor, DOP, Production Manager, Crew
            $table->string('department')->nullable();
            $table->string('character_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('contract_status')->default('Pending'); // Pending, Signed, Rejected
            $table->decimal('day_rates', 12, 2)->default(0.00);
            $table->timestamps();
        });

        // 9. budgets
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('department_id');
            $table->string('category');
            $table->decimal('budgeted_amount', 15, 2)->default(0.00);
            $table->string('currency')->default('NPR');
            $table->timestamps();
        });

        // 10. expenses
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('department_id');
            $table->string('category');
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('NPR');
            $table->text('description')->nullable();
            $table->string('receipt_image')->nullable();
            $table->date('date');
            $table->foreignId('submitted_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected, Paid
            $table->string('po_number')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();

            $table->index(['film_id', 'date']);
            $table->index(['film_id', 'status']);
        });

        // 11. call_sheets
        Schema::create('call_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->date('shoot_date');
            $table->time('general_call_time');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->text('catering_info')->nullable();
            $table->text('weather')->nullable();
            $table->text('emergency_info')->nullable();
            $table->text('special_instructions')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 12. call_sheet_entries
        Schema::create('call_sheet_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_sheet_id')->constrained('call_sheets')->onDelete('cascade');
            $table->foreignId('cast_crew_id')->constrained('cast_crew')->onDelete('cascade');
            $table->time('call_time');
            $table->json('scenes_today')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_acknowledged')->default(false);
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });

        // 13. progress_updates
        Schema::create('progress_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('scene_id')->constrained('scenes')->onDelete('cascade');
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->string('status');
            $table->json('media_files')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->boolean('scenes_completed')->default(false);
            $table->decimal('pages_completed', 4, 2)->default(0.00);
            $table->timestamps();

            $table->index(['film_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_updates');
        Schema::dropIfExists('call_sheet_entries');
        Schema::dropIfExists('call_sheets');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('cast_crew');
        Schema::dropIfExists('scene_schedule');
        Schema::dropIfExists('scenes');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('film_modules');
        Schema::dropIfExists('film_users');
        Schema::dropIfExists('films');
    }
};
