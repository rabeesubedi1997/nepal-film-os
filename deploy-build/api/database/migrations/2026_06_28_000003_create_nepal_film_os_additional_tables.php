<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. script_breakdowns
        Schema::create('script_breakdowns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scene_id')->constrained('scenes')->onDelete('cascade');
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->json('cast_ids')->nullable();
            $table->json('props')->nullable();
            $table->json('wardrobe')->nullable();
            $table->json('sfx')->nullable();
            $table->json('vehicles')->nullable();
            $table->integer('extras_count')->default(0);
            $table->integer('revision_number')->default(1);
            $table->string('version_color')->nullable();
            $table->timestamps();
        });

        // 2. shot_lists
        Schema::create('shot_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scene_id')->constrained('scenes')->onDelete('cascade');
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('shot_number');
            $table->string('shot_type')->nullable();
            $table->string('camera_angle')->nullable();
            $table->integer('lens_mm')->nullable();
            $table->string('movement')->nullable();
            $table->text('description')->nullable();
            $table->string('storyboard_image')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('status')->default('Not Started');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 3. cast_availability (Day Out of Days)
        Schema::create('cast_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cast_crew_id')->constrained('cast_crew')->onDelete('cascade');
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->date('shoot_date');
            $table->string('status'); // required, available, hold, not_required
            $table->timestamps();

            $table->unique(['cast_crew_id', 'shoot_date', 'film_id']);
        });

        // 4. wardrobe_items
        Schema::create('wardrobe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('character_name')->nullable();
            $table->foreignId('scene_id')->nullable()->constrained('scenes')->onDelete('set null');
            $table->string('description');
            $table->string('continuity_photo')->nullable();
            $table->string('status')->default('Ready'); // Ready, In Alteration, Missing
            $table->text('notes')->nullable();
            $table->string('assigned_to')->nullable();
            $table->timestamps();
        });

        // 5. continuity_records
        Schema::create('continuity_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scene_id')->constrained('scenes')->onDelete('cascade');
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('type'); // wardrobe, hair, makeup, props, set
            $table->string('continuity_photo')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('captured_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 6. tasks
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->date('due_date')->nullable();
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->string('status')->default('todo'); // todo, in_progress, done
            $table->string('related_module')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index(['film_id', 'assigned_to', 'status']);
        });

        // 7. time_sheets
        Schema::create('time_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('shoot_date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->integer('break_minutes')->default(0);
            $table->decimal('total_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['film_id', 'shoot_date']);
            $table->index(['film_id', 'user_id']);
        });

        // 8. daily_production_reports
        Schema::create('daily_production_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->date('report_date');
            $table->integer('scenes_scheduled')->default(0);
            $table->integer('scenes_completed')->default(0);
            $table->decimal('pages_scheduled', 5, 2)->default(0);
            $table->decimal('pages_completed', 5, 2)->default(0);
            $table->integer('crew_count')->default(0);
            $table->decimal('total_hours', 6, 2)->default(0);
            $table->decimal('daily_expenses', 15, 2)->default(0);
            $table->text('notes_director')->nullable();
            $table->text('notes_pm')->nullable();
            $table->timestamp('generated_at')->useCurrent();
            $table->json('sent_to')->nullable();
            $table->timestamps();
        });

        // 9. documents
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('folder')->default('General');
            $table->string('document_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->json('access_roles')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->integer('version')->default(1);
            $table->date('expires_at')->nullable();
            $table->boolean('is_watermarked')->default(false);
            $table->boolean('is_confidential')->default(false);
            $table->timestamps();
        });

        // 10. messages
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('group_id')->nullable();
            $table->foreignId('receiver_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->text('message')->nullable();
            $table->json('attachments')->nullable();
            $table->boolean('is_announcement')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();

            $table->index(['film_id', 'sender_id']);
            $table->index(['film_id', 'group_id']);
        });

        // 11. message_reads
        Schema::create('message_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('read_at')->useCurrent();

            $table->unique(['message_id', 'user_id']);
        });

        // 12. notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('film_id')->nullable()->constrained('films')->onDelete('cascade');
            $table->string('type'); // call_sheet_sent, expense_approved, task_assigned, etc.
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });

        // 13. activity_logs (audit trail)
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // created, updated, deleted, approved, etc.
            $table->string('module');
            $table->string('record_type')->nullable();
            $table->unsignedBigInteger('record_id')->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['film_id', 'created_at']);
            $table->index(['film_id', 'module']);
        });

        // 14. subscription_plans
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price_npr', 12, 2)->default(0);
            $table->decimal('price_usd', 8, 2)->default(0);
            $table->string('billing_cycle'); // monthly, yearly, one_time
            $table->integer('max_films')->default(1);
            $table->integer('max_users_per_film')->default(10);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 15. film_subscriptions
        Schema::create('film_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans')->onDelete('cascade');
            $table->string('status')->default('trial'); // trial, active, expired, cancelled
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamps();
        });

        // 16. vendors
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('film_id')->constrained('films')->onDelete('cascade');
            $table->string('name');
            $table->string('type');
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->text('address')->nullable();
            $table->text('services')->nullable();
            $table->decimal('rate', 12, 2)->nullable();
            $table->string('currency')->default('NPR');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['film_id', 'type']);
        });

        // 17. series
        Schema::create('series', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->integer('total_episodes')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('series');
        Schema::dropIfExists('film_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('message_reads');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('daily_production_reports');
        Schema::dropIfExists('time_sheets');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('continuity_records');
        Schema::dropIfExists('wardrobe_items');
        Schema::dropIfExists('cast_availability');
        Schema::dropIfExists('shot_lists');
        Schema::dropIfExists('script_breakdowns');
    }
};
