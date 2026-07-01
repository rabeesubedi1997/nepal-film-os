<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('film_users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->constrained('film_roles')->onDelete('set null')->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('film_users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
