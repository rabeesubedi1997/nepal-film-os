<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmSubscription extends Model
{
    protected $table = 'film_subscriptions';

    protected $fillable = [
        'film_id',
        'plan_id',
        'status',
        'started_at',
        'expires_at',
        'payment_reference',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
}
