<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Beat extends Model
{
    protected $fillable = [
        'beat_sheet_id',
        'title',
        'description',
        'color',
        'position_x',
        'position_y',
        'act_label',
        'scene_number',
        'order_index',
        'created_by',
    ];

    protected $casts = [
        'position_x' => 'integer',
        'position_y' => 'integer',
        'order_index' => 'integer',
    ];

    public function beatSheet()
    {
        return $this->belongsTo(BeatSheet::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
