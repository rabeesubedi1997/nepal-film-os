<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('time_sheets', function (Blueprint $table) {
            $table->string('status')->default('draft')->after('notes');
            $table->text('rejection_reason')->nullable()->after('approved_by');
            $table->timestamp('submitted_at')->nullable()->after('rejection_reason');
            $table->timestamp('approved_at')->nullable()->after('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::table('time_sheets', function (Blueprint $table) {
            $table->dropColumn(['status', 'rejection_reason', 'submitted_at', 'approved_at']);
        });
    }
};
