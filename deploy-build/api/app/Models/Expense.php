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
        // decimal:2, not float — the column is DECIMAL(15,2); casting to
        // PHP float reintroduces IEEE-754 rounding error for money.
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Expense statuses that count as actually committed/spent money.
     * Pending and Rejected must never be summed into "spent" totals.
     */
    public const COUNTED_STATUSES = ['Approved', 'Paid'];

    public function scopeCounted($query)
    {
        return $query->whereIn('status', self::COUNTED_STATUSES);
    }

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
