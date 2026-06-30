<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'film_id',
        'sender_id',
        'group_id',
        'receiver_id',
        'message',
        'attachments',
        'is_announcement',
        'is_pinned',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_announcement' => 'boolean',
        'is_pinned' => 'boolean',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function reads()
    {
        return $this->hasMany(MessageRead::class);
    }
}
