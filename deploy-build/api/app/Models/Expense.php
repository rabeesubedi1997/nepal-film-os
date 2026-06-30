<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'film_id',
        'department_id',
        'category',
        'amount',
        'currency',
        'description',
        'receipt_image',
        'date',
        'submitted_by',
        'approved_by',
        'status',
        'rejection_reason',
        'po_number',
        'payment_method',
    ];

    protected $casts = [
        'amount' => 'float',
        'date' => 'date',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
