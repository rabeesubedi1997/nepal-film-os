<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScriptDraft extends Model
{
    protected $fillable = [
        'script_id',
        'film_id',
        'title',
        'content',
        'description',
        'is_archived',
        'created_by',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    public function script()
    {
        return $this->belongsTo(Script::class);
    }

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
