<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('beat_sheet_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('color')->default('#e2a309');
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->string('act_label')->nullable();
            $table->string('scene_number')->nullable();
            $table->integer('order_index')->default(0);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beats');
    }
};
