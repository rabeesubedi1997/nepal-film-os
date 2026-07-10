<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScriptVersion extends Model
{
    protected $fillable = [
        'script_id',
        'film_id',
        'title',
        'content',
        'version_number',
        'description',
        'created_by',
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
