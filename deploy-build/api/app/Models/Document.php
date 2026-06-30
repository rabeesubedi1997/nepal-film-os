<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'film_id',
        'folder',
        'document_name',
        'file_path',
        'file_type',
        'file_size',
        'access_roles',
        'uploaded_by',
        'version',
        'expires_at',
        'is_watermarked',
        'is_confidential',
    ];

    protected $casts = [
        'access_roles' => 'array',
        'file_size' => 'integer',
        'version' => 'integer',
        'expires_at' => 'date',
        'is_watermarked' => 'boolean',
        'is_confidential' => 'boolean',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
