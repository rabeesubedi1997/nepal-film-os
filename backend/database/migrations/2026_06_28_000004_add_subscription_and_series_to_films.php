<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('films', function (Blueprint $table) {
            $table->foreignId('subscription_plan_id')
                ->nullable()
                ->after('created_by')
                ->constrained('subscription_plans')
                ->nullOnDelete();

            $table->foreignId('series_id')
                ->nullable()
                ->after('subscription_plan_id')
                ->constrained('series')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('films', function (Blueprint $table) {
            $table->dropForeign(['subscription_plan_id']);
            $table->dropForeign(['series_id']);
            $table->dropColumn(['subscription_plan_id', 'series_id']);
        });
    }
};
